import { useInfiniteQuery } from '@tanstack/react-query'
import { contactOptionsQuery } from '@/modules/contacts/core/contacts.query'
import { requesterGroups } from '@/modules/lookups/core/lookups'
import { memberOptionsQuery } from '@/modules/workspaces/core/members.query'

export function useRequesterOptions(search: string) {
  const params = { search: search || undefined }

  return requesterGroups(
    useInfiniteQuery(memberOptionsQuery(params)),
    useInfiniteQuery(contactOptionsQuery(params))
  )
}
