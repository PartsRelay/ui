import type { LookupPreviewObject, PostApiV1LookupsBody } from '@/core/api/models'
import { errorCode } from '@/core/errors'
import { type Message, message } from '@/core/message'
import { lookupFieldErrors } from '@/modules/lookups/core/lookup-form'

export type PreviewPart = { name: string; found: Message | null }

export type PartsPreview = {
  vehicle: string | null
  parts: PreviewPart[]
  nodeIds: string[]
  notice: { title?: Message; body: Message; tone: 'warning' | 'danger' } | null
  canStart: boolean
}

const NOT_FOUND: Record<string, Partial<Record<'plate' | 'vin', string>>> = {
  'oem-plate-not-found': { plate: 'lookups.preview.errors.plate-not-found' },
  'oem-vin-not-found': { vin: 'lookups.preview.errors.vin-not-found' },
}

function categoryNames(categories: LookupPreviewObject['parts'][number]['categories']) {
  return categories.map(({ id, name }) => name ?? id).join(', ')
}

function noticeOf(parts: PreviewPart[]): PartsPreview['notice'] {
  if (parts.length === 0) {
    return {
      title: message('lookups.preview.unread.title'),
      body: message('lookups.preview.unread.body'),
      tone: 'danger',
    }
  }
  if (parts.every(({ found }) => !found)) {
    return {
      title: message('lookups.preview.none.title'),
      body: message('lookups.preview.none.body'),
      tone: 'danger',
    }
  }
  if (parts.some(({ found }) => !found)) {
    return { body: message('lookups.preview.some-missing'), tone: 'warning' }
  }

  return null
}

export function partsPreview(preview: LookupPreviewObject): PartsPreview {
  const parts = preview.parts.map(({ name, categories }) => ({
    name,
    found:
      categories.length > 0
        ? message('lookups.preview.found', { categories: categoryNames(categories) })
        : null,
  }))
  const nodeIds = [
    ...new Set(preview.parts.flatMap(({ categories }) => categories.map(({ id }) => id))),
  ]

  return {
    vehicle: preview.vehicleDescription,
    parts,
    nodeIds,
    notice: noticeOf(parts),
    canStart: nodeIds.length > 0,
  }
}

export function withParts(lookup: PostApiV1LookupsBody, nodeIds: string[]): PostApiV1LookupsBody {
  return { ...lookup, nodeIds }
}

export function previewFieldErrors(error: unknown) {
  return NOT_FOUND[errorCode(error)] ?? lookupFieldErrors(error)
}
