import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostApiV1CheckoutsTokenConfirmBodyItemsItem } from '@/core/api/models'
import { insideWhatsapp } from '@/modules/checkout/core/checkout'
import { decideCheckout } from '@/modules/checkout/core/checkout.query'
import { reportError } from '@/query-client'

export function useDecideCheckout(token: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (items?: PostApiV1CheckoutsTokenConfirmBodyItemsItem[]) =>
      decideCheckout(client, token, items),
    onSuccess: ({ chatUrl }) => {
      if (chatUrl && !insideWhatsapp(navigator.userAgent)) window.location.assign(chatUrl)
    },
    onError: (error) => reportError(error),
  })
}
