import { useLayoutEffect } from 'react'
import { setTextCountry } from '@/i18n'
import type { Country } from '@/modules/workspaces/core/country'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useFlag } from '@/ui/hooks/use-flag'

export function useRegionalCountry(): Country | null {
  const { workspace } = useMe()
  const regional = useFlag('regional-format')

  return regional ? workspace.country : null
}

export function useRegionalTexts() {
  const country = useRegionalCountry()

  useLayoutEffect(() => {
    setTextCountry(country)

    return () => setTextCountry(null)
  }, [country])
}
