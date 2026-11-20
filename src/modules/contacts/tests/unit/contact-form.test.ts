import { describe, expect, it } from 'vite-plus/test'
import {
  contactFieldErrors,
  emptyContact,
  newContact,
  phoneSchema,
  renameChange,
  withPlus,
} from '@/modules/contacts/core/contact-form'
import { contactFixture, coreError } from '@/modules/contacts/tests/unit/fixtures'

const phoneError = (value: string) => phoneSchema.safeParse(value).error?.issues[0]?.message

describe('new contact', () => {
  it('starts the number empty and puts a plus before a first digit', () => {
    expect(emptyContact.phone).toBe('')
    expect(withPlus('')).toBe('')
    expect(withPlus('3')).toBe('+3')
    expect(withPlus('39 300 000 0000')).toBe('+393000000000')
    expect(withPlus('0039 300 000 0000')).toBe('+00393000000000')
  })

  it('keeps a plus typed first and drops any other', () => {
    expect(withPlus('+')).toBe('+')
    expect(withPlus('+39 300 000 0000')).toBe('+393000000000')
    expect(withPlus('++39')).toBe('+39')
    expect(withPlus('3+9')).toBe('+39')
    expect(withPlus('+39+')).toBe('+39')
  })

  it('keeps only the digits of the number', () => {
    expect(withPlus('abc')).toBe('')
    expect(withPlus('Tel. +39 300 000 0000')).toBe('+393000000000')
    expect(withPlus('(300) 000-0000')).toBe('+3000000000')
    expect(withPlus('‭+39 300 000 0000')).toBe('+393000000000')
    expect(withPlus('+٣٩٣٠٠٠٠٠٠٠٠٠')).toBe('+٣٩٣٠٠٠٠٠٠٠٠٠')
  })

  it('asks for the number when it is empty or only the plus', () => {
    expect(phoneError('')).toBe('contacts.add.errors.phone-required')
    expect(phoneError('+')).toBe('contacts.add.errors.phone-required')
    expect(phoneError('+393000000000')).toBeUndefined()
  })

  it('sends the number as typed and a trimmed optional name', () => {
    expect(newContact({ phone: ' 0044 7700 900103 ', name: '  Oakfield Garage ' })).toEqual({
      phone: '0044 7700 900103',
      name: 'Oakfield Garage',
    })
    expect(newContact({ phone: '+44 7700 900103', name: '   ' })).toEqual({
      phone: '+44 7700 900103',
    })
  })

  it('shows each error under the field the core names', () => {
    const taken = coreError(422, 'validation-error', [{ field: 'phone', rule: 'database.unique' }])
    const both = coreError(422, 'validation-error', [
      { field: 'phone', rule: 'waId' },
      { field: 'name', rule: 'minLength' },
    ])

    const full = coreError(422, 'validation-error', [{ field: 'phone', rule: 'companies' }])

    expect(contactFieldErrors(taken)).toEqual({ phone: 'contacts.add.errors.phone' })
    expect(contactFieldErrors(both)).toEqual({ phone: 'contacts.add.errors.phone' })
    expect(contactFieldErrors(full)).toEqual({ phone: 'contacts.add.errors.companies' })
    expect(contactFieldErrors(coreError(403, 'authorization-failure'))).toBeNull()
  })
})

describe('rename', () => {
  it('sends only real changes and clears with an empty name', () => {
    const contact = contactFixture(4, { name: 'Westfield Car Care' })

    expect(renameChange(' Westfield Car Care ', contact)).toBeNull()
    expect(renameChange('   ', contact)).toEqual({ name: null })
    expect(renameChange(' Westfield Motors', contact)).toEqual({ name: 'Westfield Motors' })
    expect(renameChange('', contactFixture(5))).toBeNull()
  })
})
