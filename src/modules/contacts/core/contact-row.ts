import { intlFormat } from 'date-fns'
import {
  type CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import type { ContactObject } from '@/core/api/models'
import { type Message, message } from '@/core/message'
import { type Country, toCountry } from '@/modules/workspaces/core/country'
import type { Me } from '@/modules/workspaces/core/workspace'

export type ContactRow = {
  contact: ContactObject
  name: string
  whatsappName: string | null
  phone: string
  numberCountry: Country | null
  statusLabel: Message
  tone: 'success' | 'danger'
  searches: { total: number; month: number }
  lastSearch: string | null
  joined: string
  actions: { rename: boolean; block: boolean; unblock: boolean; remove: boolean }
}

const TONES = { active: 'success', blocked: 'danger' } as const

// National with the prefix of the given country, else international
export function formatPhone(phone: string, country: Country | null = null) {
  const number = parsePhoneNumberFromString(phone)
  if (!number) return phone

  return country && number.countryCallingCode === getCountryCallingCode(country as CountryCode)
    ? number.formatNational()
    : number.formatInternational()
}

// Like the core: the country of a valid number, if in the list
export function numberCountry(waId: string) {
  return toCountry(parsePhoneNumberFromString(`+${waId}`)?.country)
}

const phoneOf = ({ waId }: ContactObject, country: Country | null) =>
  formatPhone(`+${waId}`, country)

export function contactName(contact: ContactObject, country: Country | null = null) {
  return contact.name ?? contact.profileName ?? phoneOf(contact, country)
}

export function contactRow(
  contact: ContactObject,
  me: Me,
  locale: string,
  country: Country | null = null
): ContactRow {
  const manage = me.permissions.manageContacts

  return {
    contact,
    name: contactName(contact, country),
    whatsappName: contact.name && contact.profileName !== contact.name ? contact.profileName : null,
    phone: phoneOf(contact, country),
    numberCountry: numberCountry(contact.waId),
    statusLabel: message(`contacts.status.${contact.status}`),
    tone: TONES[contact.status],
    searches: { total: contact.lookupsCount, month: contact.monthLookupsCount },
    lastSearch: contact.lastLookupAt
      ? intlFormat(contact.lastLookupAt, { dateStyle: 'medium', timeStyle: 'short' }, { locale })
      : null,
    joined: intlFormat(contact.createdAt, { dateStyle: 'medium' }, { locale }),
    actions: {
      rename: manage,
      block: manage && contact.status === 'active',
      unblock: manage && contact.status === 'blocked',
      remove: manage,
    },
  }
}
