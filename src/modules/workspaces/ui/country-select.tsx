import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { type Country, countryFlag, countryOptions } from '@/modules/workspaces/core/country'
import { TextField } from '@/ui/components/text-field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/ui/select'

type CountrySelectProps = {
  label: ReactNode
  description?: ReactNode
  name?: string
  required?: boolean
  error?: string
  value: string
  disabled?: boolean
  children?: ReactNode
  onValueChange: (country: Country) => void
}

export function CountrySelect({
  label,
  description,
  name,
  required,
  error,
  value,
  disabled,
  children,
  onValueChange,
}: CountrySelectProps) {
  const { t, i18n } = useTranslation()

  return (
    <Select value={value} disabled={disabled} onValueChange={onValueChange}>
      <TextField
        label={label}
        required={required}
        description={description}
        error={error && t(error)}
      >
        <SelectTrigger name={name} className="w-full">
          <SelectValue placeholder={t('common.choose-country')} />
        </SelectTrigger>
      </TextField>
      <SelectContent>
        <SelectGroup>
          {children}
          {countryOptions(i18n.language).map((country) => (
            <SelectItem key={country.value} value={country.value} textValue={country.label}>
              <span aria-hidden>{countryFlag(country.value)}</span> {country.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
