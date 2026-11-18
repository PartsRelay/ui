import { describe, expect, it } from 'vite-plus/test'
import {
  countries,
  countryFlag,
  countryName,
  countryOf,
  countryOptions,
  isCountry,
  toCountry,
} from '@/modules/workspaces/core/country'

describe('isCountry', () => {
  it('knows the upper case codes of Europe and the USA', () => {
    expect(countries).toHaveLength(33)
    expect(['AT', 'CH', 'GB', 'IE', 'IT', 'NO', 'US'].every(isCountry)).toBe(true)
    expect(isCountry('gb')).toBe(false)
    expect(isCountry('CA')).toBe(false)
    expect(isCountry(null)).toBe(false)
  })
})

describe('toCountry', () => {
  it('keeps a known country and gives null for anything else', () => {
    expect(toCountry('GB')).toBe('GB')
    expect(toCountry('RU')).toBeNull()
    expect(toCountry(undefined)).toBeNull()
  })
})

describe('countryOf', () => {
  it('takes the region of the browser language when it is in the list', () => {
    expect(countryOf('en-GB')).toBe('GB')
    expect(countryOf('it-IT')).toBe('IT')
    expect(countryOf('en-CA')).toBeNull()
    expect(countryOf('en')).toBeNull()
  })
})

describe('countryFlag', () => {
  it('builds the flag emoji from the code', () => {
    expect(countryFlag('IT')).toBe('🇮🇹')
    expect(countryFlag('GB')).toBe('🇬🇧')
    expect(countryFlag('US')).toBe('🇺🇸')
  })
})

describe('countryName', () => {
  it('names the country in the language of the texts', () => {
    expect(countryName('GB', 'en-US')).toBe('United Kingdom')
    expect(countryName('GB', 'it-IT')).toBe('Regno Unito')
  })
})

describe('countryOptions', () => {
  it('lists every country once, sorted by its name', () => {
    const english = countryOptions('en-US')
    const italian = countryOptions('it-IT')

    expect(english.map(({ value }) => value).sort()).toEqual([...countries].sort())
    expect(english.slice(0, 3).map(({ label }) => label)).toEqual([
      'Austria',
      'Belgium',
      'Bulgaria',
    ])
    expect(english.at(-1)).toEqual({ value: 'US', label: 'United States' })
    expect(italian.slice(0, 3).map(({ label }) => label)).toEqual(['Austria', 'Belgio', 'Bulgaria'])
    expect(italian.at(-1)).toEqual({ value: 'HU', label: 'Ungheria' })
  })
})
