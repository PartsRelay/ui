import type { LookupMessageObject, LookupObject } from '@/core/api/models'
import { errorMessage, fieldErrors } from '@/core/errors'
import { type Message, message } from '@/core/message'
import type { LookupPrefill } from '@/modules/lookups/core/lookup-form'

export const MAX_IMAGES = 4

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type TraceStep = {
  key: string
  status?: 'running' | 'error'
  title: Message
  description?: string
}

type Search = {
  sending: boolean
  error: unknown
  read: LookupMessageObject | undefined
  lookup: LookupObject | undefined
}

// What a search kept in the URL was read from, after a reload
export function readOfLookup(lookup: LookupObject): LookupMessageObject {
  return { vin: lookup.vin, plate: lookup.plate, parts: lookup.query, missing: [], lookup }
}

// The message a failed search offers to send again
export function messageOf({ plate, vin, query }: LookupPrefill) {
  return [vin ?? plate, query].filter(Boolean).join(' ')
}

export function addImages(current: File[], added: File[]) {
  const images = added.filter(
    ({ type, size }) => IMAGE_TYPES.includes(type) && size <= MAX_IMAGE_BYTES
  )
  const kept = [...current, ...images].slice(0, MAX_IMAGES)

  return {
    images: kept,
    refused:
      added.length - images.length + Math.max(0, current.length + images.length - MAX_IMAGES),
  }
}

function readStep({ vin, plate, parts }: LookupMessageObject): TraceStep {
  const description = [vin, plate, parts].filter(Boolean).join(' · ')

  return { key: 'read', title: message('lookups.ai.trace.read'), description }
}

function missingSteps({ missing }: LookupMessageObject): TraceStep[] {
  return missing.map((what) => ({
    key: `missing-${what}`,
    status: 'error',
    title: message(`lookups.ai.trace.missing-${what === 'vehicle' ? 'vehicle' : 'parts'}`),
  }))
}

function vehicleStep(lookup: LookupObject): TraceStep {
  return {
    key: 'vehicle',
    title: message('lookups.ai.trace.vehicle'),
    description: lookup.vehicleDescription ?? lookup.vin ?? undefined,
  }
}

function searchSteps(lookup: LookupObject): TraceStep[] {
  switch (lookup.status) {
    case 'running':
      return [{ key: 'search', status: 'running', title: message('lookups.ai.trace.searching') }]
    case 'vehicle_not_found':
      return [
        { key: 'search', status: 'error', title: message('lookups.ai.trace.vehicle-not-found') },
      ]
    case 'not_matched':
      return [
        vehicleStep(lookup),
        { key: 'search', status: 'error', title: message('lookups.ai.trace.not-matched') },
      ]
    case 'failed':
      return [{ key: 'search', status: 'error', title: message('lookups.ai.trace.failed') }]
    case 'done':
      return [
        vehicleStep(lookup),
        {
          key: 'search',
          title: message('lookups.ai.trace.found'),
          description: lookup.categories?.map(({ id, name }) => name ?? id).join(', '),
        },
      ]
  }
}

// The steps the assistant took, for the Trace of a search
export function searchTrace({ sending, error, read, lookup }: Search): TraceStep[] {
  if (sending) {
    return [{ key: 'read', status: 'running', title: message('lookups.ai.trace.reading') }]
  }
  if (error) {
    return [
      {
        key: 'read',
        status: 'error',
        title: message('lookups.ai.trace.read-failed'),
        description: undefined,
      },
    ]
  }
  if (!read) return []

  const started = lookup ?? read.lookup ?? undefined

  return [readStep(read), ...missingSteps(read), ...(started ? searchSteps(started) : [])]
}

export function messageError(error: unknown): Message | null {
  const fields = fieldErrors(error, {
    message: 'lookups.ai.errors.message',
    images: 'lookups.ai.errors.images',
  })
  if (fields?.message) return message(fields.message)
  if (fields?.images) return message(fields.images)

  return error ? errorMessage(error) : null
}
