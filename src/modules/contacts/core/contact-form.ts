import type { ContactObject, PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import { fieldErrors, toErrorBody } from '@/core/errors'
import { requiredText } from '@/core/schemas'
import type { ContactChange } from '@/modules/contacts/core/contacts.mutation'

export type ContactValues = { phone: string; name: string }

export const emptyContact: ContactValues = { phone: '', name: '' }

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

export const phoneSchema = requiredText('contacts.add.errors.phone-required')
