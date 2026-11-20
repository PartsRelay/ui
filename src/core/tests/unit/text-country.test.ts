import { afterEach, describe, expect, it } from 'vite-plus/test'
import { i18n, setTextCountry } from '@/i18n'

const count = () => i18n.t('lookups.list.count', { count: 12345 })

describe('numbers in texts', () => {
  afterEach(() => setTextCountry(null))

  it('follow the language without a country', async () => {
    await i18n.changeLanguage('en-US')

    expect(count()).toBe('12,345 searches')
  })

  it('follow the country once set, and the language again without it', async () => {
    await i18n.changeLanguage('en-US')

    setTextCountry('IT')
    expect(count()).toBe('12.345 searches')

    setTextCountry(null)
    expect(count()).toBe('12,345 searches')
  })
})
