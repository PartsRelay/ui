import { type Country, toCountry } from '@/modules/workspaces/core/country'

type PlateFormat = {
  pattern: RegExp
  format: string | ((plate: string) => string)
}

const groups = (plate: string) => plate.match(/[A-Z]+|\d+/g) ?? []

const halves = (group: string) =>
  group.length === 4 ? [group.slice(0, 2), group.slice(2)] : [group]

const PLATES: Partial<Record<Country, PlateFormat>> = {
  BE: { pattern: /^(\d)([A-Z]{3})(\d{3})$/, format: '$1-$2-$3' },
  BG: { pattern: /^([A-Z]{1,2})(\d{4})([A-Z]{2})$/, format: '$1 $2 $3' },
  CH: { pattern: /^([A-Z]{2})(\d{1,6})$/, format: '$1 $2' },
  CY: { pattern: /^([A-Z]{3})(\d{3})$/, format: '$1 $2' },
  CZ: { pattern: /^(\d[A-Z][A-Z0-9])(\d{4})$/, format: '$1 $2' },
  DK: { pattern: /^([A-Z]{2})(\d{2})(\d{3})$/, format: '$1 $2 $3' },
  EE: { pattern: /^(\d{3})([A-Z]{3})$/, format: '$1 $2' },
  ES: { pattern: /^(\d{4})([A-Z]{3})$/, format: '$1 $2' },
  FI: { pattern: /^([A-Z]{2,3})(\d{1,3})$/, format: '$1-$2' },
  FR: { pattern: /^([A-Z]{2})(\d{3})([A-Z]{2})$/, format: '$1-$2-$3' },
  GB: { pattern: /^([A-Z]{2}\d{2})([A-Z]{3})$/, format: '$1 $2' },
  GR: { pattern: /^([A-Z]{3})(\d{4})$/, format: '$1-$2' },
  HR: { pattern: /^([A-Z]{2})(\d{3,4})([A-Z]{1,2})$/, format: '$1 $2-$3' },
  IE: { pattern: /^(\d{2,3})([A-Z]{1,2})(\d{1,6})$/, format: '$1-$2-$3' },
  IT: { pattern: /^([A-Z]{2})(\d{3})([A-Z]{2})$/, format: '$1 $2 $3' },
  LI: { pattern: /^(FL)(\d{1,5})$/, format: '$1 $2' },
  LT: { pattern: /^([A-Z]{3})(\d{3})$/, format: '$1 $2' },
  LU: { pattern: /^([A-Z]{2})(\d{4})$/, format: '$1 $2' },
  LV: { pattern: /^([A-Z]{2})(\d{1,4})$/, format: '$1-$2' },
  MT: { pattern: /^([A-Z]{3})(\d{3})$/, format: '$1 $2' },
  NL: {
    pattern: /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{6}$/,
    format: (plate) => groups(plate).flatMap(halves).join('-'),
  },
  NO: { pattern: /^([A-Z]{2})(\d{4,5})$/, format: '$1 $2' },
  PL: { pattern: /^([A-Z]{2,3})([A-Z0-9]{4,5})$/, format: '$1 $2' },
  PT: {
    pattern: /^([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{2})$/,
    format: '$1-$2-$3',
  },
  RO: { pattern: /^([A-Z]{1,2})(\d{2,3})([A-Z]{3})$/, format: '$1 $2 $3' },
  SE: { pattern: /^([A-Z]{3})(\d{2}[A-Z0-9])$/, format: '$1 $2' },
  SK: { pattern: /^([A-Z]{2})(\d{3}[A-Z]{2})$/, format: '$1-$2' },
}

export function formatPlate(plate: string, country: Country | null) {
  const rule = country ? PLATES[country] : undefined
  if (!rule?.pattern.test(plate)) return plate

  return typeof rule.format === 'string'
    ? plate.replace(rule.pattern, rule.format)
    : rule.format(plate)
}

// The search country with contact-country on, else the company one
export function plateCountry(
  { country }: { country?: string | null },
  company: Country | null,
  searchCountry: boolean
) {
  if (!company) return null

  return (searchCountry && toCountry(country)) || company
}
