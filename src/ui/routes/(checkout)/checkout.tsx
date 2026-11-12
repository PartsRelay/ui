import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { checkoutSearchSchema } from '@/modules/checkout/core/checkout'
import { CheckoutPage } from '@/modules/checkout/ui/checkout-page'

const head = pageHead('checkout.title')

export const Route = createFileRoute('/(checkout)/checkout')({
  validateSearch: checkoutSearchSchema,
  head: () => ({ meta: [...head().meta, { name: 'referrer', content: 'no-referrer' }] }),
  component: CheckoutPage,
})
