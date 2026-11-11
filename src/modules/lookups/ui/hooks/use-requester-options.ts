import { useInfiniteQuery } from '@tanstack/react-query'
import { contactOptionsQuery } from '@/modules/contacts/core/contacts.query'
import { requesterGroups } from '@/modules/lookups/core/lookups'
import { findMembers } from '@/modules/workspaces/core/workspace'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

export function useRequesterOptions(search: string) {
  const { workspace } = useMe()
  const contacts = useInfiniteQuery(contactOptionsQuery({ search: search || undefined }))
  const groups = requesterGroups(
    findMembers(workspace.members, search),
    contacts.data?.pages.flatMap(({ data }) => data) ?? []
  )

  return { groups, pages: contacts }
}
