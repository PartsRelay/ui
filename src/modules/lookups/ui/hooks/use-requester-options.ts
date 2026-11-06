import { useInfiniteQuery } from '@tanstack/react-query'
import { contactOptionsQuery } from '@/modules/contacts/core/contacts.query'
import { requesterGroups } from '@/modules/lookups/core/lookups'
import { memberOptionsQuery } from '@/modules/workspaces/core/members.query'
import type { AutocompletePages } from '@/ui/components/autocomplete-field'

export function useRequesterOptions(search: string) {
  const params = { search: search || undefined }
  const members = useInfiniteQuery(memberOptionsQuery(params))
  const membersDone = members.isSuccess && !members.hasNextPage
  const contacts = useInfiniteQuery({ ...contactOptionsQuery(params), enabled: membersDone })
  const current = membersDone ? contacts : members

  const pages: AutocompletePages = {
    isPending: members.isPending || (membersDone && contacts.isPending),
    hasNextPage: current.hasNextPage,
    isFetchingNextPage: current.isFetchingNextPage,
    fetchNextPage: current.fetchNextPage,
  }

  const groups = requesterGroups(
    members.data?.pages.flatMap(({ data }) => data) ?? [],
    contacts.data?.pages.flatMap(({ data }) => data) ?? []
  )

  return { groups, pages }
}
