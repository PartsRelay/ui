import type { QueryClient } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import type { ApiKeyMode } from '@/modules/developers/core/api-keys'
import { apiKeysKey } from '@/modules/developers/core/api-keys.query'

export async function createApiKey(client: QueryClient, organizationId: string, mode: ApiKeyMode) {
  try {
    const { key } = await authClient.apiKey.create({ configId: mode, organizationId })

    return key
  } finally {
    await client.invalidateQueries({ queryKey: apiKeysKey })
  }
}

export async function deleteApiKey(client: QueryClient, mode: ApiKeyMode, keyId: string) {
  try {
    await authClient.apiKey.delete({ configId: mode, keyId })
  } finally {
    await client.invalidateQueries({ queryKey: apiKeysKey })
  }
}
