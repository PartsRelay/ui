import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EVERYONE,
  type RequesterOption,
  requesterSearch,
  requesterValue,
} from '@/modules/lookups/core/lookups'
import { useLookupFilters } from '@/modules/lookups/ui/hooks/use-lookup-filters'
import { useRequesterOptions } from '@/modules/lookups/ui/hooks/use-requester-options'
import { AutocompleteField } from '@/ui/components/autocomplete-field'

export function RequesterFilter({ selected }: { selected?: string }) {
  const { t } = useTranslation()
  const { search: filters, change } = useLookupFilters()
  const [search, setSearch] = useState('')
  const groups = useRequesterOptions(search)
  const value = requesterValue(filters)
  const everyone: RequesterOption = { value: EVERYONE, label: t('lookups.filter.everyone') }
  const options = groups.map((group) => ({ ...group, label: t(...group.label) }))
  const known = groups.flatMap(({ items }) => items).find((option) => option.value === value)
  const current =
    value === EVERYONE
      ? everyone
      : (known ?? { value, label: selected ?? t('lookups.filter.selected') })

  return (
    <AutocompleteField
      label={t('lookups.filter.label')}
      value={current}
      groups={search ? options : [{ items: [everyone] }, ...options]}
      itemKey={(option) => option.value}
      itemLabel={(option) => option.label}
      onValueChange={(option) => change(requesterSearch(option.value))}
      onSearch={setSearch}
    />
  )
}
