import { keepPreviousData, type QueryKey } from '@tanstack/query-core'
import { nextPage, type PageMetadata } from '@/core/pagination'

type Page = { data: unknown[]; metadata: PageMetadata }

type Fetch<Params, Result> = (
  params: Params & { page: number },
  options: undefined,
  signal: AbortSignal
) => Promise<Result>

export const optionsKey = ['options'] as const

export function optionsQuery<Params extends object, Result extends Page>(
  queryKey: QueryKey,
  fetch: Fetch<Params, Result>,
  params: Params
) {
  return {
    queryKey: [...optionsKey, ...queryKey],
    queryFn: ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) =>
      fetch({ ...params, page: pageParam }, undefined, signal),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  }
}
