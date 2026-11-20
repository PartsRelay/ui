import { useTranslation } from 'react-i18next'
import { formatLocale } from '@/core/format-locale'
import { useCountry } from '@/modules/workspaces/ui/hooks/use-country'

export function useFormatLocale() {
  const { i18n } = useTranslation()

  return formatLocale(i18n.language, useCountry())
}
