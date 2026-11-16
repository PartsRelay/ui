import { intlFormat } from 'date-fns'

export const apiKeyModes = ['test', 'live'] as const

export type ApiKeyMode = (typeof apiKeyModes)[number]

type ApiKey = { id: string; configId: string; start: string | null; createdAt: Date }

export type ApiKeyView = {
  mode: ApiKeyMode
  key?: { id: string; start: string | null; created: string }
}

export function apiKeyViews(keys: ApiKey[], locale: string): ApiKeyView[] {
  return apiKeyModes.map((mode) => {
    const key = keys.find(({ configId }) => configId === mode)

    return {
      mode,
      key: key && {
        id: key.id,
        start: key.start,
        created: intlFormat(key.createdAt, { dateStyle: 'medium' }, { locale }),
      },
    }
  })
}
