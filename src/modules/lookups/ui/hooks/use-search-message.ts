import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostApiV1LookupsMessageBody } from '@/core/api/models'
import { searchMessage } from '@/modules/lookups/core/lookups.mutation'
import { reportError } from '@/query-client'

// The chat shows the errors, only a lost session is notified
export function useSearchMessage() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (body: PostApiV1LookupsMessageBody) => searchMessage(client, body),
    onError: (error) => reportError(error, true),
  })
}
