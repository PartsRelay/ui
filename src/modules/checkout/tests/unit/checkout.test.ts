import { describe, expect, it } from 'vite-plus/test'
import type { CheckoutObject } from '@/core/api/models'
import {
  articleCode,
  checkoutSearchSchema,
  checkoutView,
  insideWhatsapp,
  orderItems,
  pieces,
  unavailable,
} from '@/modules/checkout/core/checkout'

const part = (code: string, matches: [brand: string | null, code: string][] = []) => ({
  code,
  name: `Part ${code}`,
  position: '4',
  aftermarket: matches.map(([brand, match]) => ({ brand, code: match, description: null })),
})

const unit = (name: string | null, original: ReturnType<typeof part>[]) => ({
  code: '50110',
  name,
  imageUrl: null,
  thumbnailUrl: null,
  original,
})

const categories: CheckoutObject['categories'] = [
  {
    id: 'g4',
    name: 'Front brake pads',
    units: [
      unit('Front brakes', [
        part('77367141', [
          ['BREMBO', 'P 23 141'],
          [null, 'GDB1891'],
        ]),
      ]),
      unit(null, [part('46402682')]),
      unit('Empty', []),
    ],
  },
]

describe('checkoutView', () => {
  const view = checkoutView({ categories })

  it('lists every part once, the original before its matches', () => {
    expect(view.articles).toEqual([
      { index: 0, original: true, code: '77367141', brand: null, description: 'Part 77367141' },
      { index: 1, original: false, code: 'P 23 141', brand: 'BREMBO', description: null },
      { index: 2, original: false, code: 'GDB1891', brand: null, description: null },
      { index: 3, original: true, code: '46402682', brand: null, description: 'Part 46402682' },
    ])
  })

  it('groups the parts by unit, named after the category when the unit has no name', () => {
    expect(view.groups.map(({ key, name, parts }) => [key, name, parts.length])).toEqual([
      ['g4:0', 'Front brakes', 1],
      ['g4:1', 'Front brake pads', 1],
    ])
    expect(view.groups[0]!.parts[0]).toMatchObject({ key: 'g4:0:0', position: '4' })
    expect(view.groups[0]!.parts[0]!.articles).toEqual(view.articles.slice(0, 3))
  })

  it('orders only the parts with a quantity', () => {
    const quantities = [2, 0, 1, 0]

    expect(orderItems(view.articles, quantities)).toEqual([
      { code: '77367141', brand: null, quantity: 2 },
      { code: 'GDB1891', brand: null, quantity: 1 },
    ])
    expect(pieces(quantities)).toBe(3)
    expect(pieces([])).toBe(0)
  })
})

describe('checkout helpers', () => {
  it('names an aftermarket part by brand and code', () => {
    expect(articleCode({ brand: 'BREMBO', code: 'P 23 141' })).toBe('BREMBO P 23 141')
    expect(articleCode({ brand: null, code: 'GDB1891' })).toBe('GDB1891')
  })

  it('reads the token of the link, empty when missing', () => {
    expect(checkoutSearchSchema.parse({ token: 'gcm.v1:abc' })).toEqual({ token: 'gcm.v1:abc' })
    expect(checkoutSearchSchema.parse({})).toEqual({ token: '' })
  })

  it('tells a link that cannot be opened from any other failure', () => {
    const failure = (status: number, code: string) => ({
      isAxiosError: true,
      response: { status, data: { code, status, message: code } },
    })

    expect(unavailable(failure(404, 'checkout-not-found'))).toBe(true)
    expect(unavailable(failure(409, 'checkout-closed'))).toBe(false)
    expect(unavailable(new TypeError('offline'))).toBe(false)
  })

  it('knows the browser of WhatsApp by its user agent', () => {
    const chrome =
      'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'

    expect(insideWhatsapp(`${chrome} WhatsApp/2.26.1`)).toBe(true)
    expect(insideWhatsapp(chrome)).toBe(false)
  })
})
