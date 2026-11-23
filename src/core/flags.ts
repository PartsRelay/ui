import type { PostHog } from 'posthog-js'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'

export type Flag = 'ai-search'

// Flags count as loaded after this wait, if PostHog stays silent
const LOAD_TIMEOUT_MS = 3000

const listeners = new Set<() => void>()

let posthog: PostHog | undefined
let loading: Promise<void> | undefined
let loaded = false

const arrived = () => {
  loaded = true
  listeners.forEach((listener) => listener())
}

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
    client.onFeatureFlags(arrived)
    posthog = client
    setTimeout(() => loaded || arrived(), LOAD_TIMEOUT_MS)
  })
}

// Whether a flag off is off, and not still on its way
export function flagsLoaded() {
  return loaded || !env.POSTHOG_PROJECT_TOKEN || mocksEnabled
}

export function onFlags(listener: () => void) {
  listeners.add(listener)

  return () => void listeners.delete(listener)
}

export function flagEnabled(flag: string) {
  if (mocksEnabled) return localStorage.getItem('mock.flags')?.split(',').includes(flag) === true

  return posthog?.isFeatureEnabled(flag) === true
}
