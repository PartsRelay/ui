import { authClient } from '@/modules/auth/core/auth.client'

export const apiKeysKey = ['api-keys'] as const

export function apiKeysQuery(organizationId: string) {
  return {
    queryKey: [...apiKeysKey, organizationId] as const,
    queryFn: async () => (await authClient.apiKey.list({ query: { organizationId } })).apiKeys,
    meta: { silent: true },
  }
}
