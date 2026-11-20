import { memberCountry } from '@/modules/workspaces/core/country'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useFlag } from '@/ui/hooks/use-flag'

export function useCountry() {
  const { session, workspace } = useMe()
  const personal = useFlag('personal-country')

  return memberCountry(workspace.country, session.user.country, personal)
}
