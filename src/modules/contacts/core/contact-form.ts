import { type CountryCode, getCountryCallingCode, getExampleNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'
import { z } from 'zod'
import type { ContactObject, PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import { fieldErrors, toErrorBody } from '@/core/errors'
import type { ContactChange } from '@/modules/contacts/core/contacts.mutation'
import type { Country } from '@/modules/workspaces/core/country'

export const MAX_COMPANIES = 3

export type ContactValues = { phone: string; name: string }

export const emptyContact: ContactValues = { phone: '+', name: '' }

export const withPlus = (value: string) => `+${value.replace(/^\P{Nd}+|\+/gu, '')}`

export function newContact({ phone, name }: ContactValues): PostApiV1WorkspaceContactsBody {
  const trimmed = name.trim()

  return trimmed ? { phone: phone.trim(), name: trimmed } : { phone: phone.trim() }
}

export function contactFieldErrors(error: unknown) {
  const full = toErrorBody(error).fields?.some(({ rule }) => rule === 'companies')

  return fieldErrors(error, {
    phone: full ? 'contacts.add.errors.companies' : 'contacts.add.errors.phone',
  })
}

export function renameChange(value: string, contact: ContactObject): ContactChange | null {
  const name = value.trim() || null

  return name === contact.name ? null : { name }
}

export const phoneSchema = z.string().regex(/[^+\s]/, 'contacts.add.errors.phone-required')

export function phoneExample(country: Country) {
  const code = country as CountryCode

  return (
    getExampleNumber(code, examples)?.formatInternational() ?? `+${getCountryCallingCode(code)}`
  )
}
