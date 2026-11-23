import type { LookupObject } from '@/core/api/models'
import { plateCountry } from '@/modules/lookups/core/plate'
import { useRegionalCountry } from '@/modules/workspaces/ui/hooks/use-regional-country'
import { useFlag } from '@/ui/hooks/use-flag'

export function usePlateCountry() {
  const company = useRegionalCountry()
  const searchCountry = useFlag('contact-country')

  return (lookup: Pick<LookupObject, 'country'>) => plateCountry(lookup, company, searchCountry)
}
