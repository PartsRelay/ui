import { useInfiniteQuery } from '@tanstack/react-query'
import { contactOptionsQuery } from '@/modules/contacts/core/contacts.query'
import { requesterGroups } from '@/modules/lookups/core/lookups'
import { memberOptionsQuery } from '@/modules/workspaces/core/members.query'

export function useRequesterOptions(search: string) {
  const params = { search: search || undefined }
  const memberPages = useInfiniteQuery(memberOptionsQuery(params))
  const contactPages = useInfiniteQuery(contactOptionsQuery(params))
  const [members, contacts] = requesterGroups(
    memberPages.data?.pages.flatMap(({ data }) => data) ?? [],
    contactPages.data?.pages.flatMap(({ data }) => data) ?? []
  )

  return [
    { ...members, pages: memberPages },
    { ...contacts, pages: contactPages },
  ]
}
