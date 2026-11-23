import type { QueryClient } from '@tanstack/query-core'
import { postApiV1LookupsMessage } from '@/core/api/endpoints/lookups/lookups'
import type { PostApiV1LookupsMessageBody } from '@/core/api/models'
import { refreshLookupLists } from '@/modules/lookups/core/lookups.query'

export async function searchMessage(client: QueryClient, body: PostApiV1LookupsMessageBody) {
  const { data } = await postApiV1LookupsMessage(body)
  if (data.lookup) await refreshLookupLists(client)

  return data
}
