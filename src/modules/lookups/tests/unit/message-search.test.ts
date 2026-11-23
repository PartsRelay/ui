import { describe, expect, it } from 'vite-plus/test'
import type { LookupMessageObject } from '@/core/api/models'
import { message } from '@/core/message'
import { coreError } from '@/modules/contacts/tests/unit/fixtures'
import {
  addImages,
  MAX_IMAGE_BYTES,
  messageError,
  messageOf,
  readOfLookup,
  searchTrace,
} from '@/modules/lookups/core/message-search'
import { lookupFixture } from '@/modules/lookups/tests/unit/fixtures'

const read = (overrides: Partial<LookupMessageObject> = {}): LookupMessageObject => ({
  vin: null,
  plate: 'AB123CD',
  parts: 'front brake pads',
  missing: [],
  lookup: null,
  ...overrides,
})

const photo = (name: string, type = 'image/jpeg', size = 1000) =>
  new File([new Uint8Array(size)], name, { type })

const idle = { sending: false, error: null, read: undefined, lookup: undefined }

describe('message search', () => {
  it('starts a failed search again as one message, VIN first', () => {
    expect(messageOf({ plate: 'AB123CD', query: 'Oil filter' })).toBe('AB123CD Oil filter')
    expect(messageOf({ vin: 'WF0FXXGCDFKA12345', query: 'Oil filter' })).toBe(
      'WF0FXXGCDFKA12345 Oil filter'
    )
    expect(messageOf({})).toBe('')
  })

  it('keeps up to 4 photos of an image type and size, and counts the others', () => {
    const kept = addImages(
      [photo('1.jpg')],
      [photo('2.png', 'image/png'), photo('doc.pdf', 'application/pdf')]
    )
    expect(kept.images.map(({ name }) => name)).toEqual(['1.jpg', '2.png'])
    expect(kept.refused).toBe(1)

    const full = addImages(
      [photo('1.jpg'), photo('2.jpg'), photo('3.jpg')],
      [photo('4.jpg'), photo('5.jpg'), photo('big.jpg', 'image/jpeg', MAX_IMAGE_BYTES + 1)]
    )
    expect(full.images).toHaveLength(4)
    expect(full.refused).toBe(2)
  })

  it('shows the reading, then what was read and what is missing', () => {
    expect(searchTrace({ ...idle, sending: true })).toEqual([
      { key: 'read', status: 'running', title: message('lookups.ai.trace.reading') },
    ])
    expect(searchTrace({ ...idle, read: read({ plate: null, missing: ['vehicle'] }) })).toEqual([
      { key: 'read', title: message('lookups.ai.trace.read'), description: 'front brake pads' },
      {
        key: 'missing-vehicle',
        status: 'error',
        title: message('lookups.ai.trace.missing-vehicle'),
      },
    ])
    expect(searchTrace({ ...idle, error: new Error('down') })).toMatchObject([
      { key: 'read', status: 'error', title: message('lookups.ai.trace.read-failed') },
    ])
  })

  it('follows the search it started until its outcome', () => {
    const running = lookupFixture(7, { status: 'running', categories: undefined })
    const started = read({ vin: 'WF0FXXGCDFKA12345', lookup: running })

    expect(searchTrace({ ...idle, read: started }).at(-1)).toEqual({
      key: 'search',
      status: 'running',
      title: message('lookups.ai.trace.searching'),
    })
    expect(searchTrace({ ...idle, read: started, lookup: lookupFixture(7) })).toEqual([
      {
        key: 'read',
        title: message('lookups.ai.trace.read'),
        description: 'WF0FXXGCDFKA12345 · AB123CD · front brake pads',
      },
      {
        key: 'vehicle',
        title: message('lookups.ai.trace.vehicle'),
        description: 'Ford Fiesta 1.0',
      },
      { key: 'search', title: message('lookups.ai.trace.found'), description: 'Oil filter' },
    ])
    expect(
      searchTrace({
        ...idle,
        read: started,
        lookup: lookupFixture(7, { status: 'vehicle_not_found', categories: undefined }),
      }).at(-1)
    ).toMatchObject({ status: 'error', title: message('lookups.ai.trace.vehicle-not-found') })
  })

  it('puts the errors of the fields under the request', () => {
    expect(
      messageError(coreError(422, 'validation-error', [{ field: 'images', rule: 'file.size' }]))
    ).toEqual(message('lookups.ai.errors.images'))
    expect(messageError(null)).toBeNull()
  })

  it('shows a search kept in the address as read from its row', () => {
    const lookup = lookupFixture(7)

    expect(readOfLookup(lookup)).toEqual({
      vin: 'WF0FXXGCDFKA12345',
      plate: 'AB12CDE',
      parts: 'Oil filter change',
      missing: [],
      lookup,
    })
  })
})
