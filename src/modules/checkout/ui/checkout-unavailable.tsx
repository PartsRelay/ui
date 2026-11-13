import { LinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/ui/components/empty-state'

export function CheckoutUnavailable() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<LinkIcon />}
      title={<h1>{t('checkout.unavailable.title')}</h1>}
      description={t('checkout.unavailable.description')}
    />
  )
}
