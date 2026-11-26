import { describe, expect, it } from 'vite-plus/test'
import type { LookupMessageObject } from '@/core/api/models'
import { message } from '@/core/message'
import { coreError } from '@/modules/contacts/tests/unit/fixtures'
import {
  addImages,
  assistantReply,
  MAX_IMAGE_BYTES,
  messageError,
  messageOf,
  messageRequest,
  readOfLookup,
  requestOfLookup,
  retryable,
  searchOutcome,
  searchTrace,
} from '@/modules/lookups/core/message-search'
import { lookupFixture } from '@/modules/lookups/tests/unit/fixtures'

const read = (overrides: Partial<LookupMessageObject> = {}): LookupMessageObject => ({
  vin: null,
  plate: 'AB123CD',
  parts: 'front brake pads',
  missing: [],
  reply: 'Ok',
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
      reply: '',
      lookup,
    })
  })

  it('shows a search kept in the address as the request it stands for', () => {
    expect(requestOfLookup(lookupFixture(7))).toBe('AB12CDE Oil filter change')
    expect(requestOfLookup(lookupFixture(7, { plate: null }))).toBe(
      'WF0FXXGCDFKA12345 Oil filter change'
    )
  })

  it('sends one message of its chat: the core remembers the ones before it', () => {
    const plate = photo('libretto.jpg')

    expect(messageRequest('chat-1', ' GH 482 KL ', [plate])).toEqual({
      conversation: 'chat-1',
      message: 'GH 482 KL',
      images: [plate],
    })
    expect(messageRequest('chat-1', '  ', [plate])).toEqual({
      conversation: 'chat-1',
      images: [plate],
    })
    expect(messageRequest('chat-1', 'si', [])).toEqual({ conversation: 'chat-1', message: 'si' })
  })

  it('answers with the words of the assistant, before and after a search starts', () => {
    const answer = (said: LookupMessageObject) =>
      assistantReply({ error: null, read: said, lookup: undefined })
    const running = lookupFixture(7, { status: 'running' })

    expect(assistantReply({ error: null, read: undefined, lookup: undefined })).toBeNull()
    expect(answer(read({ reply: 'Front or rear?', parts: null, missing: ['parts'] }))).toBe(
      'Front or rear?'
    )
    expect(answer(read({ reply: 'Search started for AB123CD.', lookup: running }))).toBe(
      'Search started for AB123CD.'
    )
  })

  it('follows a search only in its newest turn', () => {
    const changed = read({ lookup: lookupFixture(7, { status: 'running' }) })

    expect(searchTrace({ ...idle, read: changed }, false).map(({ key }) => key)).toEqual(['read'])
    expect(searchTrace({ ...idle, read: changed }).map(({ key }) => key)).toEqual([
      'read',
      'search',
    ])
  })

  it('tells the outcome of the search once it ends, with the order page when it has one', () => {
    const outcome = (lookup: Parameters<typeof lookupFixture>[1]) =>
      searchOutcome(lookupFixture(7, lookup))
    const found = { count: 1, vehicle: 'Ford Fiesta 1.0', categories: 'Oil filter' }

    expect(searchOutcome(undefined)).toBeNull()
    expect(outcome({ status: 'running', categories: undefined })).toBeNull()
    expect(outcome({})).toEqual(message('lookups.ai.reply.found', found))
    expect(outcome({ orderUrl: 'https://app.example.com/checkout?token=t' })).toEqual(
      message('lookups.ai.reply.order', found)
    )
    expect(outcome({ categories: [] })).toEqual(message('lookups.ai.reply.done'))
    expect(outcome({ status: 'not_matched', categories: [] })).toEqual(
      message('lookups.ai.reply.not-matched', {
        vehicle: 'Ford Fiesta 1.0',
        parts: 'Oil filter change',
      })
    )
    expect(outcome({ status: 'vehicle_not_found', vehicleDescription: null })).toEqual(
      message('lookups.ai.reply.vehicle-not-found', { identifier: 'WF0FXXGCDFKA12345' })
    )
    expect(outcome({ status: 'failed' })).toEqual(message('lookups.ai.reply.failed'))
  })

  it('tells a search kept in the address by its outcome, having no words of the assistant', () => {
    const lookup = lookupFixture(7)

    expect(assistantReply({ error: null, read: readOfLookup(lookup), lookup })).toEqual(
      message('lookups.ai.reply.found', {
        count: 1,
        vehicle: 'Ford Fiesta 1.0',
        categories: 'Oil filter',
      })
    )
  })

  it('answers a refused request with its reason, and offers to send again the others', () => {
    const refused = coreError(422, 'validation-error', [{ field: 'message', rule: 'maxLength' }])

    expect(assistantReply({ error: refused, read: undefined, lookup: undefined })).toEqual(
      message('lookups.ai.errors.message')
    )
    expect(retryable(refused)).toBe(false)
    expect(retryable(coreError(503, 'service-unavailable'))).toBe(true)
  })
})
