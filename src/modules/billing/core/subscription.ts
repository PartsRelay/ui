import { intlFormat } from 'date-fns'

// Slug of the product in the core checkout
export const SUBSCRIPTION_SLUG = 'subscription'

type Subscription = {
  current_period_end: string | null
  cancel_at_period_end: boolean
  product: { name: string }
}

export type SubscriptionView =
  | { state: 'none' }
  | { state: 'active' | 'ending'; product: string; date: string | null }

export function subscriptionView([subscription]: Subscription[], locale: string): SubscriptionView {
  if (!subscription) return { state: 'none' }

  const { product, current_period_end: end, cancel_at_period_end: ending } = subscription

  return {
    state: ending ? 'ending' : 'active',
    product: product.name,
    date: end && intlFormat(new Date(end), { dateStyle: 'medium' }, { locale }),
  }
}
