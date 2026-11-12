import type { QueryClient } from '@tanstack/query-core'
import {
  getGetApiV1CheckoutsTokenQueryKey,
  getGetApiV1CheckoutsTokenQueryOptions,
  postApiV1CheckoutsTokenCancel,
  postApiV1CheckoutsTokenConfirm,
} from '@/core/api/endpoints/checkouts/checkouts'
import type { CheckoutObject, PostApiV1CheckoutsTokenConfirmBodyItemsItem } from '@/core/api/models'

export function checkoutQuery(token: string) {
  return getGetApiV1CheckoutsTokenQueryOptions<CheckoutObject>(token, {
    query: { select: ({ data }) => data, meta: { silent: true }, enabled: token !== '' },
  })
}

export async function decideCheckout(
  client: QueryClient,
  token: string,
  items?: PostApiV1CheckoutsTokenConfirmBodyItemsItem[]
) {
  const key = getGetApiV1CheckoutsTokenQueryKey(token)
  const decided = await (
    items ? postApiV1CheckoutsTokenConfirm(token, { items }) : postApiV1CheckoutsTokenCancel(token)
  ).catch(async (error: unknown) => {
    await client.invalidateQueries({ queryKey: key })
    throw error
  })

  client.setQueryData(key, decided)

  return decided.data
}
