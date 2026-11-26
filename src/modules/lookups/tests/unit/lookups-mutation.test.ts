import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import { searchMessage } from '@/modules/lookups/core/lookups.mutation'
import { lookupKey, lookupsQuery } from '@/modules/lookups/core/lookups.query'
import { lookupFixture, pageFixture } from '@/modules/lookups/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

const read = { vin: null, plate: 'AB123CD', parts: 'filtro olio', missing: [], reply: 'Ok' }

describe('searching from a message', () => {
  it('sends the message, then follows the search it started or changed and reloads the lists', async () => {
    const running = lookupFixture(12, { status: 'running', vin: null, categories: undefined })
    vi.mocked(http).mockResolvedValue({ data: { ...read, lookup: running } })
    const client = new QueryClient()
    const list = lookupsQuery({ page: 1 }).queryKey
    client.setQueryData(list, pageFixture([]))

    expect(await searchMessage(client, { message: 'AB123CD filtro olio' })).toEqual({
      ...read,
      lookup: running,
    })
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/lookups/message', method: 'POST' }),
      undefined
    )
    expect(client.getQueryState(list)?.isInvalidated).toBe(true)
    // A search changed by this message is running again for who follows it
    expect(client.getQueryData(lookupKey(12))).toEqual({ data: running })
  })

  it('leaves the lists alone when the message starts no search', async () => {
    vi.mocked(http).mockResolvedValue({
      data: { ...read, plate: null, missing: ['vehicle'], lookup: null },
    })
    const client = new QueryClient()
    const list = lookupsQuery({ page: 1 }).queryKey
    client.setQueryData(list, pageFixture([]))

    await searchMessage(client, { message: 'filtro olio' })

    expect(client.getQueryState(list)?.isInvalidated).toBe(false)
  })
})
