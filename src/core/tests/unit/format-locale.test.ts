import { describe, expect, it, vi } from 'vite-plus/test'
import { formatLocale } from '@/core/format-locale'

describe('formatLocale', () => {
  it('takes the first browser locale in the language of the texts', () => {
    expect(formatLocale('en-US', ['en-GB', 'en-US'])).toBe('en-GB')
    expect(formatLocale('en-US', ['it-IT', 'en-IE'])).toBe('en-IE')
    expect(formatLocale('it-IT', ['en-GB', 'it-CH', 'it-IT'])).toBe('it-CH')
  })

  it('keeps the language of the texts when the browser has no locale in it', () => {
    expect(formatLocale('en-US', ['de-DE', 'fr-FR'])).toBe('en-US')
    expect(formatLocale('it-IT', [])).toBe('it-IT')
  })

  it('reads the locales of the browser', () => {
    vi.stubGlobal('navigator', { languages: ['en-GB', 'en'] })

    expect(formatLocale('en-US')).toBe('en-GB')
  })
})
