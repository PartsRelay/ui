import type { QueryClient } from '@tanstack/query-core'
import { postApiV1LookupsMessage } from '@/core/api/endpoints/lookups/lookups'
import type { PostApiV1LookupsMessageBody } from '@/core/api/models'
import { lookupKey, refreshLookupLists } from '@/modules/lookups/core/lookups.query'

export async function searchMessage(client: QueryClient, body: PostApiV1LookupsMessageBody) {
  const { data } = await postApiV1LookupsMessage(body)

  if (data.lookup) {
    // A changed search runs again: who follows it starts from here
    client.setQueryData(lookupKey(data.lookup.id), { data: data.lookup })
    await refreshLookupLists(client)
  }

  return data
}
