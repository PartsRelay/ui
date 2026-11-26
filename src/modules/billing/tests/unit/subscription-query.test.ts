import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { subscriptionQuery } from '@/modules/billing/core/subscription.query'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { customer: { subscriptions: { list } } },
}))

const fetched = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } }).fetchQuery(
    subscriptionQuery('1')
  )

beforeEach(() => {
  list.mockReset()
})

describe('subscriptionQuery', () => {
  it('asks the core for the active subscriptions of the company and shows its own errors', async () => {
    const items = [{ id: 'sub_1' }]
    list.mockResolvedValue({ items, pagination: { total_count: 1, max_page: 1 } })
    const query = subscriptionQuery('1')

    expect(query.queryKey).toEqual(['subscription', '1'])
    expect(query.meta).toEqual({ silent: true })
    expect(await fetched()).toBe(items)
    expect(list).toHaveBeenCalledWith({ query: { reference_id: '1', active: true } })
  })

  it('is null when the core has no Polar', async () => {
    list.mockRejectedValue({ status: 404, error: { code: 'route-not-found' } })

    expect(await fetched()).toBeNull()
  })

  it('fails for any other refusal', async () => {
    const refusal = { status: 403, error: { code: 'subscription-owner-only' } }
    list.mockRejectedValue(refusal)

    await expect(fetched()).rejects.toBe(refusal)
  })
})
