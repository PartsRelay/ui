import { intlFormat } from 'date-fns'
import { describe, expect, it } from 'vite-plus/test'
import { formatLocale } from '@/core/format-locale'

const formatted = (locale: string) =>
  intlFormat(new Date(2026, 10, 17, 15, 4), { dateStyle: 'medium', timeStyle: 'short' }, { locale })

describe('formatLocale', () => {
  it('takes the formats and the clock of the country in the language of the texts', () => {
    expect(formatLocale('en-US', 'US')).toBe('en-US-u-hc-h12')
    expect(formatLocale('en-US', 'GB')).toBe('en-GB-u-hc-h23')
    expect(formatLocale('en-US', 'IT')).toBe('en-IT-u-hc-h23')
    expect(formatLocale('it-IT', 'IT')).toBe('it-IT-u-hc-h23')
  })

  it('uses European English in a European country without English formats', () => {
    expect(formatLocale('en-US', 'GR')).toBe('en-150-u-hc-h12')
  })

  it('keeps any other language as it is, with the clock of the country', () => {
    expect(formatLocale('it-IT', 'US')).toBe('it-IT-u-hc-h12')
  })

  it('is the language of the texts without a country', () => {
    expect(formatLocale('en-US')).toBe('en-US')
    expect(formatLocale('it-IT', null)).toBe('it-IT')
  })

  it('gives one tag that formats dates and numbers', () => {
    expect(formatted(formatLocale('en-US', 'US'))).toMatch(/^Nov 17, 2026, 3:04\sPM$/u)
    expect(formatted(formatLocale('en-US', 'GB'))).toBe('17 Nov 2026, 15:04')
    expect(formatted(formatLocale('en-US', 'GR'))).toMatch(/^17 Nov 2026, 3:04\spm$/u)
    expect(formatted(formatLocale('it-IT', 'US'))).toMatch(/^17 nov 2026, 3:04\sPM$/u)
    expect((1234.5).toLocaleString(formatLocale('en-US', 'IT'))).toBe('1.234,5')
    expect((1234.5).toLocaleString(formatLocale('en-US', 'GB'))).toBe('1,234.5')
  })
})
