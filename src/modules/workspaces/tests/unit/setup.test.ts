import { addDays } from 'date-fns'
import { describe, expect, it } from 'vite-plus/test'
import { pendingInvitation, setupDefaults, setupSchemas } from '@/modules/workspaces/core/setup'

const now = new Date('2026-10-21T10:00:00Z')

const redwoodParts = {
  name: 'Redwood Parts Ltd',
  locale: 'en-US',
  country: 'GB',
  setup: 'done',
} as const

const offer = (id: string, status: string, expiresInDays: number) => ({
  id,
  organizationName: 'Ironworks Garage Ltd',
  status,
  expiresAt: addDays(now, expiresInDays).toISOString(),
})

describe('pendingInvitation', () => {
  it('is null without invitations', () => {
    expect(pendingInvitation(undefined, now)).toBeNull()
    expect(pendingInvitation([], now)).toBeNull()
  })

  it('picks the first invitation still pending', () => {
    const invitations = [
      offer('30', 'pending', -1),
      offer('31', 'canceled', 5),
      offer('32', 'pending', 5),
      offer('33', 'pending', 6),
    ]

    expect(pendingInvitation(invitations, now)?.id).toBe('32')
  })

  it('ignores invitations expired or no longer pending', () => {
    expect(pendingInvitation([offer('30', 'pending', -1), offer('31', 'accepted', 5)], now)).toBe(
      null
    )
  })
})

describe('setupDefaults', () => {
  const pending = { ...redwoodParts, country: 'US', setup: 'pending' as const }

  it('starts a pending company empty, in the browser language and country', () => {
    expect(setupDefaults(pending, 'it-IT', 'IT')).toEqual({
      name: '',
      locale: 'it-IT',
      country: 'IT',
      userName: '',
    })
  })

  it('leaves the country empty when the browser has none of the list', () => {
    expect(setupDefaults(pending, 'en-US', null).country).toBe('')
  })

  it('keeps the name, language and country of a company already set up', () => {
    const company = { ...redwoodParts, locale: 'it-IT' as const }

    expect(setupDefaults(company, 'en-US', 'US')).toEqual({
      name: 'Redwood Parts Ltd',
      locale: 'it-IT',
      country: 'GB',
      userName: '',
    })
  })
})

describe('setupSchemas', () => {
  it('refuses an empty country', () => {
    expect(setupSchemas.country.safeParse('GB').success).toBe(true)
    expect(setupSchemas.country.safeParse('').error?.issues[0]?.message).toBe(
      'setup.errors.country-required'
    )
  })
})
