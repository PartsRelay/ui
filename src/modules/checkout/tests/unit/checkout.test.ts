import { describe, expect, it } from 'vite-plus/test'
import type { CheckoutObject } from '@/core/api/models'
import {
  articleCode,
  checkoutSearchSchema,
  checkoutView,
  insideWhatsapp,
  NOT_LOADED,
  orderedByVehicle,
  orderItems,
  pieces,
  priceOf,
  unavailable,
} from '@/modules/checkout/core/checkout'

const part = (code: string, matches: [brand: string | null, code: string][] = []) => ({
  code,
  name: `Part ${code}`,
  position: '4',
  aftermarket: matches.map(([brand, match]) => ({
    brand,
    code: match,
    description: null,
    // Loaded by the seller only for its own brands
    ...(brand && { price: '48.90', currency: 'EUR', available: 4 as number | null }),
  })),
})

const unknown = { price: null, currency: null, available: null }
const stock = { price: '48.90', currency: 'EUR', available: 4 }

const unit = (name: string | null, original: ReturnType<typeof part>[]) => ({
  code: '50110',
  name,
  imageUrl: null,
  thumbnailUrl: null,
  original,
})

type Search = CheckoutObject['searches'][number]

const categories: Search['categories'] = [
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

const panda: Search = {
  id: 7,
  plate: 'AB123CD',
  vin: 'ZFA31200003456789',
  query: 'front brake pads',
  vehicleDescription: 'Fiat Panda 1.2',
  categories,
}

// A second vehicle of the same order, found by its VIN
const golf: Search = {
  id: 9,
  plate: null,
  vin: 'WVWZZZAUZHW204411',
  query: 'brake pads',
  vehicleDescription: null,
  categories: [{ id: 'g4', name: 'Front brake pads', units: [unit(null, [part('5Q0698151')])] }],
}

describe('checkoutView', () => {
  const view = checkoutView({ searches: [panda, golf] })

  it('lists every part once, the original before its matches, with its search', () => {
    expect(view.articles).toEqual(
      [
        { index: 0, original: true, code: '77367141', brand: null, description: 'Part 77367141' },
        { index: 1, original: false, code: 'P 23 141', brand: 'BREMBO', description: null },
        { index: 2, original: false, code: 'GDB1891', brand: null, description: null },
        { index: 3, original: true, code: '46402682', brand: null, description: 'Part 46402682' },
        { index: 4, original: true, code: '5Q0698151', brand: null, description: 'Part 5Q0698151' },
      ].map((article) => ({
        ...unknown,
        lookupId: article.index < 4 ? 7 : 9,
        ...article,
        ...(article.brand && stock),
      }))
    )
  })

  it('writes the price in the format of the reader, a dash when not loaded', () => {
    const [original, loaded] = view.articles

    expect(priceOf(loaded!, 'en-US')).toBe('€48.90')
    expect(priceOf(loaded!, 'it-IT')).toBe('48,90\u00a0€')
    expect(priceOf(original!, 'en-US')).toBe(NOT_LOADED)
    expect(priceOf({ price: '48.90', currency: null }, 'en-US')).toBe(NOT_LOADED)
  })

  it('gives each vehicle its section, named by its plate or its VIN', () => {
    expect(view.vehicles.map(({ key, title, groups }) => [key, title, groups.length])).toEqual([
      [7, 'AB123CD · Fiat Panda 1.2 · front brake pads', 2],
      [9, 'WVWZZZAUZHW204411 · brake pads', 1],
    ])
  })

  it('groups the parts by unit, named after the category when the unit has no name', () => {
    const [{ groups }, other] = view.vehicles

    expect(groups.map(({ key, name, parts }) => [key, name, parts.length])).toEqual([
      ['7:g4:0', 'Front brakes', 1],
      ['7:g4:1', 'Front brake pads', 1],
    ])
    expect(groups[0]!.parts[0]).toMatchObject({ key: '7:g4:0:0', position: '4' })
    expect(groups[0]!.parts[0]!.articles).toEqual(view.articles.slice(0, 3))
    // The same category of two vehicles never shares a key
    expect(other!.groups[0]!.key).toBe('9:g4:0')
  })

  it('orders only the parts with a quantity, each for its search', () => {
    const quantities = [2, 0, 1, 0, 3]

    expect(orderItems(view.articles, quantities)).toEqual([
      { lookupId: 7, code: '77367141', brand: null, quantity: 2 },
      { lookupId: 7, code: 'GDB1891', brand: null, quantity: 1 },
      { lookupId: 9, code: '5Q0698151', brand: null, quantity: 3 },
    ])
    expect(pieces(quantities)).toBe(6)
    expect(pieces([])).toBe(0)
  })

  it('shows the parts ordered under their vehicle, and no vehicle without parts', () => {
    const item = { original: true, brand: null, description: null, quantity: 1 }
    const items = [
      { ...item, lookupId: 9, code: '5Q0698151' },
      { ...item, lookupId: 9, code: '5Q0698152' },
    ]

    expect(orderedByVehicle({ searches: [panda, golf], items })).toEqual([
      { key: 9, title: 'WVWZZZAUZHW204411', items },
    ])
    expect(orderedByVehicle({ searches: [panda], items: [] })).toEqual([])
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
