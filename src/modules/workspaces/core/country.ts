export type Country = string

export const countries: Country[] = [
  'AT',
  'BE',
  'BG',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GB',
  'GR',
  'HR',
  'HU',
  'IE',
  'IS',
  'IT',
  'LI',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
  'US',
]

export function isCountry(value: unknown): value is Country {
  return countries.includes(value as Country)
}

export function toCountry(value: unknown): Country | null {
  return isCountry(value) ? value : null
}

export function countryOf(language: string) {
  return toCountry(new Intl.Locale(language).region)
}

export function countryName(country: Country, locale: string) {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(country) ?? country
}

export function countryOptions(locale: string) {
  return countries
    .map((country) => ({ value: country, label: countryName(country, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale))
}
