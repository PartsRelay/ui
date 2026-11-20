import type { PostHog } from 'posthog-js'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'

export type Flag = 'parts-preview'

const listeners = new Set<() => void>()

let posthog: PostHog | undefined
let loading: Promise<void> | undefined

export function loadFlags(userId: string) {
  const token = env.POSTHOG_PROJECT_TOKEN
  if (!token || mocksEnabled) return

  loading ??= import('posthog-js').then(({ default: client }) => {
    client.init(token, {
      api_host: env.POSTHOG_HOST,
      persistence: 'memory',
      opt_out_capturing_by_default: true,
      disable_external_dependency_loading: true,
      bootstrap: { distinctID: userId, isIdentifiedID: true },
    })
    client.onFeatureFlags(() => listeners.forEach((listener) => listener()))
    posthog = client
  })
}

export function onFlags(listener: () => void) {
  listeners.add(listener)

  return () => void listeners.delete(listener)
}

export function flagEnabled(flag: string) {
  if (mocksEnabled) return localStorage.getItem('mock.flags')?.split(',').includes(flag) === true

  return posthog?.isFeatureEnabled(flag) === true
}
