import { useTranslation } from 'react-i18next'
import type { OrderItem } from '@/core/api/models'
import { articleCode } from '@/modules/checkout/core/checkout'

export function useArticleName() {
  const { t } = useTranslation()

  return (article: Pick<OrderItem, 'original' | 'brand' | 'code'>) =>
    article.original
      ? t('lookups.results.original-code', { code: article.code })
      : articleCode(article)
}
