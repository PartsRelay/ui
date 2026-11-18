import { isAfter } from 'date-fns'
import { requiredText } from '@/core/schemas'
import type { Country } from '@/modules/workspaces/core/country'
import type { Workspace } from '@/modules/workspaces/core/workspace'

type UserInvitation = {
  id: string
  organizationName: string
  status: string
  expiresAt: Date | string
}

export type SetupValues = { name: string; country: Country; userName: string }

export function pendingInvitation(invitations: UserInvitation[] | undefined, now: Date) {
  return (
    invitations?.find(
      (invitation) => invitation.status === 'pending' && isAfter(invitation.expiresAt, now)
    ) ?? null
  )
}

export function setupDefaults(
  workspace: Pick<Workspace, 'name' | 'country' | 'setup'>,
  browserCountry: Country | null
): SetupValues {
  const pending = workspace.setup === 'pending'

  return {
    name: pending ? '' : workspace.name,
    country: (pending ? browserCountry : workspace.country) ?? '',
    userName: '',
  }
}

export const setupSchemas = {
  name: requiredText('setup.errors.name-required'),
  country: requiredText('setup.errors.country-required'),
  userName: requiredText('setup.errors.user-name-required'),
}
