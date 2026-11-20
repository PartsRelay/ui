import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useFlag } from '@/ui/hooks/use-flag'

export function usePlateCountry() {
  const { workspace } = useMe()
  const regionalPlates = useFlag('regional-plates')

  return regionalPlates ? workspace.country : null
}
