import { useTranslation } from 'react-i18next'
import { formatLocale } from '@/core/format-locale'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

export function useFormatLocale() {
  const { i18n } = useTranslation()
  const { workspace } = useMe()

  return formatLocale(i18n.language, workspace.country)
}
