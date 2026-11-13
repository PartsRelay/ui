import { useInfiniteQuery } from '@tanstack/react-query'
import { contactOptionsQuery } from '@/modules/contacts/core/contacts.query'
import { requesterGroups } from '@/modules/lookups/core/lookups'
import { memberOptionsQuery } from '@/modules/workspaces/core/members.query'

export function useRequesterOptions(search: string) {
  const params = { search: search || undefined }
  const members = useInfiniteQuery(memberOptionsQuery(params))
  const contacts = useInfiniteQuery(contactOptionsQuery(params))
  const [team, workshops] = requesterGroups(
    members.data?.pages.flatMap(({ data }) => data) ?? [],
    contacts.data?.pages.flatMap(({ data }) => data) ?? []
  )

  return [
    { ...team, pages: members },
    { ...workshops, pages: contacts },
  ]
}
