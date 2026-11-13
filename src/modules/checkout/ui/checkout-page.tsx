import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { unavailable } from '@/modules/checkout/core/checkout'
import { checkoutQuery } from '@/modules/checkout/core/checkout.query'
import { CheckoutClosed } from '@/modules/checkout/ui/checkout-closed'
import { CheckoutForm } from '@/modules/checkout/ui/checkout-form'
import { CheckoutUnavailable } from '@/modules/checkout/ui/checkout-unavailable'
import { ListSkeleton } from '@/ui/components/list-skeleton'
import { LoadError } from '@/ui/components/load-error'
import { Logo } from '@/ui/components/logo'

const route = getRouteApi('/(checkout)/checkout')

export function CheckoutPage() {
  const { token } = route.useSearch()
  const checkout = useQuery(checkoutQuery(token))

  return (
    <main className="mx-auto grid w-full max-w-2xl content-start gap-6 p-4 sm:p-6">
      <Logo className="w-36" />
      {checkout.data?.status === 'open' ? (
        <CheckoutForm token={token} checkout={checkout.data} />
      ) : checkout.data ? (
        <CheckoutClosed checkout={checkout.data} />
      ) : !token || (checkout.isLoadingError && unavailable(checkout.error)) ? (
        <CheckoutUnavailable />
      ) : checkout.isLoadingError ? (
        <LoadError error={checkout.error} onRetry={() => void checkout.refetch()} />
      ) : (
        <ListSkeleton />
      )}
    </main>
  )
}
