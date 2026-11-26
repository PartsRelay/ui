import { errorCode } from '@/core/errors'
import { authClient } from '@/modules/auth/core/auth.client'

export const subscriptionKey = ['subscription'] as const

// null when the core has no Polar
export function subscriptionQuery(workspaceId: string) {
  return {
    queryKey: [...subscriptionKey, workspaceId] as const,
    queryFn: async () => {
      try {
        const { items } = await authClient.customer.subscriptions.list({
          query: { reference_id: workspaceId, active: true },
        })

        return items
      } catch (error) {
        if (errorCode(error) === 'route-not-found') return null

        throw error
      }
    },
    meta: { silent: true },
  }
}
