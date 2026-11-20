import { describe, expect, it } from 'vite-plus/test'
import {
  contactFieldErrors,
  emptyContact,
  newContact,
  phoneExample,
  phoneSchema,
  renameChange,
  withPlus,
} from '@/modules/contacts/core/contact-form'
import { contactFixture, coreError } from '@/modules/contacts/tests/unit/fixtures'

const phoneError = (value: string) => phoneSchema.safeParse(value).error?.issues[0]?.message

describe('new contact', () => {
  it('starts the number with a plus that cannot be removed', () => {
    expect(emptyContact.phone).toBe('+')
    expect(withPlus('')).toBe('+')
    expect(withPlus('39 300 000 0000')).toBe('+39 300 000 0000')
    expect(withPlus('3+9 300 000 0000')).toBe('+39 300 000 0000')
  })

  it('keeps one plus when a pasted number brings its own', () => {
    expect(withPlus('+39 300 000 0000')).toBe('+39 300 000 0000')
    expect(withPlus('++39 300 000 0000')).toBe('+39 300 000 0000')
    expect(withPlus('+39 300 000 0000+')).toBe('+39 300 000 0000')
  })

  it('drops what a pasted number has before its first digit', () => {
    expect(withPlus(' +39 300 000 0000')).toBe('+39 300 000 0000')
    expect(withPlus('‭+39 300 000 0000')).toBe('+39 300 000 0000')
    expect(withPlus('Tel. +39 300 000 0000')).toBe('+39 300 000 0000')
    expect(withPlus('+٣٩٣٠٠٠٠٠٠٠٠٠')).toBe('+٣٩٣٠٠٠٠٠٠٠٠٠')
  })

  it('asks for the number when only the plus is there', () => {
    expect(phoneError('+')).toBe('contacts.add.errors.phone-required')
    expect(phoneError('+ ')).toBe('contacts.add.errors.phone-required')
    expect(phoneError('+39 300 000 0000')).toBeUndefined()
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

describe('phone example', () => {
  it('is a mobile number of the country with its prefix', () => {
    expect(phoneExample('IT')).toBe('+39 312 345 6789')
    expect(phoneExample('US')).toBe('+1 201 555 0123')
    expect(phoneExample('DE')).toBe('+49 1512 3456789')
  })
})
