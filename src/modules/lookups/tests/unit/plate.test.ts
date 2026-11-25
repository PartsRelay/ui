import { describe, expect, it } from 'vite-plus/test'
import { formatPlate, plateCountry } from '@/modules/lookups/core/plate'

describe('formatPlate', () => {
  it('writes a plate as the country of the company does', () => {
    expect(formatPlate('AB123CD', 'IT')).toBe('AB 123 CD')
    expect(formatPlate('AB123CD', 'FR')).toBe('AB-123-CD')
    expect(formatPlate('AB12CDE', 'GB')).toBe('AB12 CDE')
    expect(formatPlate('1234BCD', 'ES')).toBe('1234 BCD')
    expect(formatPlate('1ABC234', 'BE')).toBe('1-ABC-234')
    expect(formatPlate('AB12345', 'DK')).toBe('AB 12 345')
    expect(formatPlate('ZG1234AB', 'HR')).toBe('ZG 1234-AB')
    expect(formatPlate('12D12345', 'IE')).toBe('12-D-12345')
    expect(formatPlate('WPI1234', 'PL')).toBe('WPI 1234')
    expect(formatPlate('AA00AA', 'PT')).toBe('AA-00-AA')
  })

  it('splits a Dutch plate where letters and digits meet, and a group of 4 in two', () => {
    expect(formatPlate('AB123C', 'NL')).toBe('AB-123-C')
    expect(formatPlate('1ABC23', 'NL')).toBe('1-ABC-23')
    expect(formatPlate('AB1234', 'NL')).toBe('AB-12-34')
    expect(formatPlate('ABCD12', 'NL')).toBe('AB-CD-12')
    expect(formatPlate('ABCDEF', 'NL')).toBe('ABCDEF')
  })

  it('leaves a plate as stored when its country has no format or it does not fit it', () => {
    expect(formatPlate('AB123CD', null)).toBe('AB123CD')
    expect(formatPlate('MAB1234', 'DE')).toBe('MAB1234')
    expect(formatPlate('7ABC123', 'US')).toBe('7ABC123')
    expect(formatPlate('AB12CDE', 'IT')).toBe('AB12CDE')
    expect(formatPlate('ROMA12', 'IT')).toBe('ROMA12')
  })
})

describe('plateCountry', () => {
  it('is the country of the search with contact-country on, else of the company', () => {
    expect(plateCountry({ country: 'US' }, 'IT', true)).toBe('US')
    expect(plateCountry({ country: 'US' }, 'IT', false)).toBe('IT')
    expect(plateCountry({ country: null }, 'IT', true)).toBe('IT')
    expect(plateCountry({ country: 'JP' }, 'IT', true)).toBe('IT')
  })

  it('is none for a company without a country', () => {
    expect(plateCountry({ country: 'US' }, null, true)).toBeNull()
  })
})
