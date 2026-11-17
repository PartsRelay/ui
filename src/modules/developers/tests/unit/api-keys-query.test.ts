import { QueryClient } from '@tanstack/query-core'
import { describe, expect, it, vi } from 'vite-plus/test'
import { apiKeysQuery } from '@/modules/developers/core/api-keys.query'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: { apiKey: { list } } }))

describe('apiKeysQuery', () => {
  it('asks the core for the keys of the company and shows its own errors', async () => {
    const apiKeys = [{ id: '4', configId: 'test', start: 'test_qWeRtYu' }]
    list.mockResolvedValue({ apiKeys, total: 1 })
    const query = apiKeysQuery('1')

    expect(query.queryKey).toEqual(['api-keys', '1'])
    expect(query.meta).toEqual({ silent: true })
    expect(await new QueryClient().fetchQuery(query)).toBe(apiKeys)
    expect(list).toHaveBeenCalledWith({ query: { organizationId: '1' } })
  })
})
