import type { LookupObject } from '@/core/api/models'
import { plateCountry } from '@/modules/lookups/core/plate'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

export function usePlateCountry() {
  const { country } = useMe().workspace

  return (lookup: Pick<LookupObject, 'country'>) => plateCountry(lookup, country)
}
