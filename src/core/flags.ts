import type { PostHog } from 'posthog-js'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'

export type Flag = 'magic-link' | 'regional-format' | 'contact-country'

// PostHog group type of a company, as the core sends it
export const WORKSPACE_GROUP = 'workspace'

// Distinct id of the visitor before sign in, as the core sends it
export const SIGNED_OUT = 'signed-out'

const listeners = new Set<() => void>()

let posthog: PostHog | undefined
let loading: Promise<PostHog> | undefined
let current: string | undefined

const notify = () => listeners.forEach((listener) => listener())

function client(distinctId: string) {
  const token = env.POSTHOG_PROJECT_TOKEN
  if (!token || mocksEnabled) return undefined

  return (loading ??= import('posthog-js').then(({ default: instance }) => {
    instance.init(token, {
      api_host: env.POSTHOG_HOST,
      persistence: 'memory',
      opt_out_capturing_by_default: true,
      disable_external_dependency_loading: true,
      bootstrap: { distinctID: distinctId, isIdentifiedID: true },
    })
    instance.onFeatureFlags(notify)
    posthog = instance
    current = distinctId

    return instance
  }))
}

// The user id, or SIGNED_OUT before sign in
export function loadFlags(distinctId: string, workspaceId?: string) {
  void client(distinctId)?.then((instance) => {
    if (current !== distinctId) {
      if (current !== undefined) instance.reset()
      instance.identify(distinctId)
      current = distinctId
    }
    if (workspaceId) instance.group(WORKSPACE_GROUP, workspaceId)
  })
}

// Forget the user and its company at sign out
export function resetFlags() {
  if (!posthog) return

  posthog.reset()
  current = undefined
  notify()
}

export function onFlags(listener: () => void) {
  listeners.add(listener)

  return () => void listeners.delete(listener)
}

export function flagEnabled(flag: string) {
  if (mocksEnabled) return localStorage.getItem('mock.flags')?.split(',').includes(flag) === true

  return posthog?.isFeatureEnabled(flag) === true
}
