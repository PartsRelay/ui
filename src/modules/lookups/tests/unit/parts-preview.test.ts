import { describe, expect, it } from 'vite-plus/test'
import type { LookupPreviewObject } from '@/core/api/models'
import { message } from '@/core/message'
import { coreError } from '@/modules/contacts/tests/unit/fixtures'
import { partsPreview, previewFieldErrors, withParts } from '@/modules/lookups/core/parts-preview'

const preview = (parts: LookupPreviewObject['parts']): LookupPreviewObject => ({
  vin: 'ZFA31200007712345',
  vehicleDescription: 'Fiat Panda 1.2 8V',
  parts,
})

const pads = {
  name: 'pastiglie',
  categories: [
    { id: 'front-brake-pads', name: 'Front brake pads' },
    { id: 'brake-discs', name: null },
  ],
}

const filter = { name: 'oil filter', categories: [{ id: 'oil-filter', name: 'Oil filter' }] }

const wipers = { name: 'wipers', categories: [] }

describe('parts preview', () => {
  it('says where each part is searched and which ones the vehicle has not', () => {
    expect(partsPreview(preview([pads, wipers]))).toEqual({
      vehicle: 'Fiat Panda 1.2 8V',
      parts: [
        {
          name: 'pastiglie',
          found: message('lookups.preview.found', {
            categories: 'Front brake pads, brake-discs',
          }),
        },
        { name: 'wipers', found: null },
      ],
      nodeIds: ['front-brake-pads', 'brake-discs'],
      notice: { body: message('lookups.preview.some-missing'), tone: 'warning' },
      canStart: true,
    })
  })

  it('searches each category once and needs no notice when every part is found', () => {
    const view = partsPreview(preview([filter, { ...filter, name: 'filtro olio' }]))

    expect(view.nodeIds).toEqual(['oil-filter'])
    expect(view.notice).toBeNull()
    expect(view.canStart).toBe(true)
  })

  it('cannot start without a part found or read', () => {
    expect(partsPreview(preview([wipers]))).toMatchObject({
      nodeIds: [],
      notice: { title: message('lookups.preview.none.title'), tone: 'danger' },
      canStart: false,
    })
    expect(partsPreview(preview([]))).toMatchObject({
      notice: { title: message('lookups.preview.unread.title'), tone: 'danger' },
      canStart: false,
    })
  })

  it('starts the search with the categories of the preview', () => {
    expect(withParts({ plate: 'GH482KL', query: 'pastiglie' }, ['front-brake-pads'])).toEqual({
      plate: 'GH482KL',
      query: 'pastiglie',
      nodeIds: ['front-brake-pads'],
    })
  })

  it('puts an unknown vehicle on its field and keeps the validation errors', () => {
    expect(previewFieldErrors(coreError(404, 'oem-plate-not-found'))).toEqual({
      plate: 'lookups.preview.errors.plate-not-found',
    })
    expect(previewFieldErrors(coreError(404, 'oem-vin-not-found'))).toEqual({
      vin: 'lookups.preview.errors.vin-not-found',
    })
    expect(previewFieldErrors(coreError(422, 'validation-error', [{ field: 'query' }]))).toEqual({
      query: 'lookups.new.errors.query',
    })
    expect(previewFieldErrors(coreError(502, 'oem-request-failed'))).toBeNull()
  })
})
