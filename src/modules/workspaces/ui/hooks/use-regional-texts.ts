import { useLayoutEffect } from 'react'
import { setTextCountry } from '@/i18n'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

export function useRegionalTexts() {
  const { country } = useMe().workspace

  useLayoutEffect(() => {
    setTextCountry(country)

    return () => setTextCountry(null)
  }, [country])
}
