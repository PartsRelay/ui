import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { type Country, countryOptions } from '@/modules/workspaces/core/country'
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
          <SelectValue />
        </SelectTrigger>
      </TextField>
      <SelectContent>
        <SelectGroup>
          {countryOptions(i18n.language).map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
