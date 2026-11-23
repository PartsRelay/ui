import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const { env, posthog } = vi.hoisted(() => ({
  env: {
    POSTHOG_PROJECT_TOKEN: 'phc_test' as string | undefined,
    POSTHOG_HOST: 'https://posthog.test',
    MOCKS: false,
  },
  posthog: {
    init: vi.fn(),
    onFeatureFlags: vi.fn(),
    isFeatureEnabled: vi.fn(),
    get_distinct_id: vi.fn(),
    identify: vi.fn(),
    group: vi.fn(),
    reset: vi.fn(),
  },
}))

vi.mock('@/env', () => ({ env }))
vi.mock('posthog-js', () => ({ default: posthog }))

async function signIn(userId: string, workspaceId?: string) {
  const flags = await import('@/core/flags')
  flags.loadFlags(userId, workspaceId)
  await vi.dynamicImportSettled()

  return flags
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  env.POSTHOG_PROJECT_TOKEN = 'phc_test'
  env.MOCKS = false
  posthog.get_distinct_id.mockImplementation(
    () => posthog.init.mock.calls[0]?.[1].bootstrap.distinctID
  )
})

describe('flags', () => {
  it('leaves PostHog out without a project token', async () => {
    env.POSTHOG_PROJECT_TOKEN = undefined

    const { flagEnabled } = await signIn('7')

    expect(posthog.init).not.toHaveBeenCalled()
    expect(flagEnabled('new-search')).toBe(false)
  })

  it('leaves PostHog out with the mocks', async () => {
    env.MOCKS = true

    await signIn('7')

    expect(posthog.init).not.toHaveBeenCalled()
  })

  it('reads the flags of mock.flags with the mocks', async () => {
    env.MOCKS = true
    vi.stubGlobal('localStorage', { getItem: () => 'new-search,regional-format' })

    const { flagEnabled } = await signIn('7')

    expect(flagEnabled('regional-format')).toBe(true)
    expect(flagEnabled('regional')).toBe(false)
  })

  it('asks PostHog once, for the signed in user and without analytics', async () => {
    const { loadFlags } = await signIn('7')
    loadFlags('7')
    await vi.dynamicImportSettled()

    expect(posthog.init).toHaveBeenCalledExactlyOnceWith('phc_test', {
      api_host: 'https://posthog.test',
      persistence: 'memory',
      opt_out_capturing_by_default: true,
      disable_external_dependency_loading: true,
      bootstrap: { distinctID: '7', isIdentifiedID: true },
    })
  })

  it('reads a flag on only when PostHog says so', async () => {
    const { flagEnabled } = await signIn('7')

    posthog.isFeatureEnabled.mockReturnValue(true)
    expect(flagEnabled('new-search')).toBe(true)
    posthog.isFeatureEnabled.mockReturnValue(false)
    expect(flagEnabled('new-search')).toBe(false)
    posthog.isFeatureEnabled.mockReturnValue(undefined)
    expect(flagEnabled('new-search')).toBe(false)
  })

  it('tells the listeners when the flags arrive', async () => {
    const { onFlags } = await signIn('7')
    const listener = vi.fn()
    const stop = onFlags(listener)
    const [[arrived]] = posthog.onFeatureFlags.mock.calls

    arrived()
    stop()
    arrived()

    expect(listener).toHaveBeenCalledOnce()
  })

  it('puts the user in the PostHog group of its company', async () => {
    const { loadFlags } = await signIn('7', 'acme')
    loadFlags('7', 'acme')
    await vi.dynamicImportSettled()

    expect(posthog.group).toHaveBeenCalledWith('workspace', 'acme')
    expect(posthog.identify).not.toHaveBeenCalled()
  })

  it('forgets the user at sign out and asks again for the next one', async () => {
    const { loadFlags, onFlags, resetFlags } = await signIn('7', 'acme')
    const listener = vi.fn()
    onFlags(listener)

    resetFlags()
    posthog.get_distinct_id.mockReturnValue('anonymous-after-reset')
    loadFlags('8', 'globex')
    await vi.dynamicImportSettled()

    expect(posthog.reset).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledOnce()
    expect(posthog.init).toHaveBeenCalledOnce()
    expect(posthog.identify).toHaveBeenCalledExactlyOnceWith('8')
    expect(posthog.group).toHaveBeenLastCalledWith('workspace', 'globex')
  })

  it('has nothing to forget before PostHog is loaded', async () => {
    const { resetFlags } = await import('@/core/flags')

    resetFlags()

    expect(posthog.reset).not.toHaveBeenCalled()
  })
})
