import type { Country } from '@/modules/workspaces/core/country'

type PlateFormat = {
  example: string
  pattern?: RegExp
  format?: string | ((plate: string) => string)
}

const groups = (plate: string) => plate.match(/[A-Z]+|\d+/g) ?? []

const halves = (group: string) =>
  group.length === 4 ? [group.slice(0, 2), group.slice(2)] : [group]

const PLATES: Partial<Record<Country, PlateFormat>> = {
  BE: { example: '1-ABC-234', pattern: /^(\d)([A-Z]{3})(\d{3})$/, format: '$1-$2-$3' },
  BG: { example: 'CA 1234 AB', pattern: /^([A-Z]{1,2})(\d{4})([A-Z]{2})$/, format: '$1 $2 $3' },
  CH: { example: 'ZH 123456', pattern: /^([A-Z]{2})(\d{1,6})$/, format: '$1 $2' },
  CY: { example: 'ABC 123', pattern: /^([A-Z]{3})(\d{3})$/, format: '$1 $2' },
  CZ: { example: '1AB 2345', pattern: /^(\d[A-Z][A-Z0-9])(\d{4})$/, format: '$1 $2' },
  DE: { example: 'M-AB 1234' },
  DK: { example: 'AB 12 345', pattern: /^([A-Z]{2})(\d{2})(\d{3})$/, format: '$1 $2 $3' },
  EE: { example: '123 ABC', pattern: /^(\d{3})([A-Z]{3})$/, format: '$1 $2' },
  ES: { example: '1234 BCD', pattern: /^(\d{4})([A-Z]{3})$/, format: '$1 $2' },
  FI: { example: 'ABC-123', pattern: /^([A-Z]{2,3})(\d{1,3})$/, format: '$1-$2' },
  FR: { example: 'AB-123-CD', pattern: /^([A-Z]{2})(\d{3})([A-Z]{2})$/, format: '$1-$2-$3' },
  GB: { example: 'AB12 CDE', pattern: /^([A-Z]{2}\d{2})([A-Z]{3})$/, format: '$1 $2' },
  GR: { example: 'ABE-1234', pattern: /^([A-Z]{3})(\d{4})$/, format: '$1-$2' },
  HR: { example: 'ZG 1234-AB', pattern: /^([A-Z]{2})(\d{3,4})([A-Z]{1,2})$/, format: '$1 $2-$3' },
  IE: { example: '12-D-12345', pattern: /^(\d{2,3})([A-Z]{1,2})(\d{1,6})$/, format: '$1-$2-$3' },
  IT: { example: 'AB 123 CD', pattern: /^([A-Z]{2})(\d{3})([A-Z]{2})$/, format: '$1 $2 $3' },
  LI: { example: 'FL 12345', pattern: /^(FL)(\d{1,5})$/, format: '$1 $2' },
  LT: { example: 'ABC 123', pattern: /^([A-Z]{3})(\d{3})$/, format: '$1 $2' },
  LU: { example: 'AB 1234', pattern: /^([A-Z]{2})(\d{4})$/, format: '$1 $2' },
  LV: { example: 'AB-1234', pattern: /^([A-Z]{2})(\d{1,4})$/, format: '$1-$2' },
  MT: { example: 'ABC 123', pattern: /^([A-Z]{3})(\d{3})$/, format: '$1 $2' },
  NL: {
    example: 'AB-123-C',
    pattern: /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{6}$/,
    format: (plate) => groups(plate).flatMap(halves).join('-'),
  },
  NO: { example: 'AB 12345', pattern: /^([A-Z]{2})(\d{4,5})$/, format: '$1 $2' },
  PL: { example: 'WA 12345', pattern: /^([A-Z]{2,3})([A-Z0-9]{4,5})$/, format: '$1 $2' },
  PT: {
    example: 'AA-00-AA',
    pattern: /^([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{2})$/,
    format: '$1-$2-$3',
  },
  RO: { example: 'B 123 ABC', pattern: /^([A-Z]{1,2})(\d{2,3})([A-Z]{3})$/, format: '$1 $2 $3' },
  SE: { example: 'ABC 123', pattern: /^([A-Z]{3})(\d{2}[A-Z0-9])$/, format: '$1 $2' },
  SK: { example: 'BA-123AB', pattern: /^([A-Z]{2})(\d{3}[A-Z]{2})$/, format: '$1-$2' },
}

export function formatPlate(plate: string, country: Country | null) {
  const rule = country ? PLATES[country] : undefined
  if (!rule?.pattern || !rule.format || !rule.pattern.test(plate)) return plate

  return typeof rule.format === 'string'
    ? plate.replace(rule.pattern, rule.format)
    : rule.format(plate)
}

export function plateExample(country: Country | null) {
  return (country && PLATES[country]?.example) || null
}
