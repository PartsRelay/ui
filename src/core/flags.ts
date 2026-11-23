import type { PostHog } from 'posthog-js'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'

export type Flag = never

// PostHog group type of a company, as the core sends it
export const WORKSPACE_GROUP = 'workspace'

const listeners = new Set<() => void>()

let posthog: PostHog | undefined
let loading: Promise<PostHog> | undefined

const notify = () => listeners.forEach((listener) => listener())

function client(userId: string) {
  const token = env.POSTHOG_PROJECT_TOKEN
  if (!token || mocksEnabled) return undefined

  return (loading ??= import('posthog-js').then(({ default: instance }) => {
    instance.init(token, {
      api_host: env.POSTHOG_HOST,
      persistence: 'memory',
      opt_out_capturing_by_default: true,
      disable_external_dependency_loading: true,
      bootstrap: { distinctID: userId, isIdentifiedID: true },
    })
    instance.onFeatureFlags(notify)
    posthog = instance

    return instance
  }))
}

export function loadFlags(userId: string, workspaceId?: string) {
  void client(userId)?.then((instance) => {
    if (instance.get_distinct_id() !== userId) instance.identify(userId)
    if (workspaceId) instance.group(WORKSPACE_GROUP, workspaceId)
  })
}

// Forget the user and its company at sign out
export function resetFlags() {
  if (!posthog) return

  posthog.reset()
  notify()
}

export function onFlags(listener: () => void) {
  listeners.add(listener)

  return () => void listeners.delete(listener)
}

export function flagEnabled(flag: string) {
  return posthog?.isFeatureEnabled(flag) === true
}
