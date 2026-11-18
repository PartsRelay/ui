import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApiKey, deleteApiKey } from '@/modules/developers/core/api-keys.mutation'
import { apiKeysQuery } from '@/modules/developers/core/api-keys.query'

const { create, remove } = vi.hoisted(() => ({ create: vi.fn(), remove: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { apiKey: { create, delete: remove } },
}))

const { queryKey } = apiKeysQuery('1')
const secret = `test_${'k'.repeat(64)}`

let client: QueryClient

const refreshed = () => client.getQueryState(queryKey)?.isInvalidated

beforeEach(() => {
  client = new QueryClient()
  client.setQueryData(queryKey, [])
  create.mockReset()
  remove.mockReset()
})

describe('createApiKey', () => {
  it('creates the key of a mode for the company and refreshes the list', async () => {
    create.mockResolvedValue({ id: '4', configId: 'test', start: 'test_kkkkkkk', key: secret })

    await expect(createApiKey(client, '1', 'test')).resolves.toBe(secret)

    expect(create).toHaveBeenCalledWith({ configId: 'test', organizationId: '1' })
    expect(refreshed()).toBe(true)
  })

  it('gives the whole key back without keeping it in the cache', async () => {
    create.mockResolvedValue({ id: '4', configId: 'test', start: 'test_kkkkkkk', key: secret })

    await createApiKey(client, '1', 'test')

    const cached = client.getQueryCache().getAll()
    expect(JSON.stringify(cached.map(({ state }) => state.data))).not.toContain(secret)
  })

  it('refreshes the list when the core refuses', async () => {
    create.mockRejectedValue(new Error('Refused'))

    await expect(createApiKey(client, '1', 'live')).rejects.toThrow('Refused')
    expect(refreshed()).toBe(true)
  })
})

describe('deleteApiKey', () => {
  it('deletes the key in its mode and refreshes the list', async () => {
    remove.mockResolvedValue({ success: true })

    await deleteApiKey(client, 'live', '7')

    expect(remove).toHaveBeenCalledWith({ configId: 'live', keyId: '7' })
    expect(refreshed()).toBe(true)
  })

  it('refreshes the list when the key is already gone', async () => {
    remove.mockRejectedValue(new Error('Gone'))

    await expect(deleteApiKey(client, 'test', '4')).rejects.toThrow('Gone')
    expect(refreshed()).toBe(true)
  })
})
