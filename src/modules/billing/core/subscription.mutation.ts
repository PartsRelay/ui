import { authClient } from '@/modules/auth/core/auth.client'
import { SUBSCRIPTION_SLUG } from '@/modules/billing/core/subscription'

export async function startCheckout(workspaceId: string) {
  const { url } = await authClient.checkout({
    slug: SUBSCRIPTION_SLUG,
    reference_id: workspaceId,
    redirect: false,
  })

  window.location.assign(url)
}

export async function openPortal() {
  const { url } = await authClient.customer.portal({ redirect: false })

  window.location.assign(url)
}
