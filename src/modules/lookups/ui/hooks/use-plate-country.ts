import type { LookupObject } from '@/core/api/models'
import { plateCountry } from '@/modules/lookups/core/plate'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useFlag } from '@/ui/hooks/use-flag'

export function usePlateCountry() {
  const { country } = useMe().workspace
  const searchCountry = useFlag('contact-country')

  return (lookup: Pick<LookupObject, 'country'>) => plateCountry(lookup, country, searchCountry)
}
