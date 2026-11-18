import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { apiKeyViews } from '@/modules/developers/core/api-keys'
import { apiKeysQuery } from '@/modules/developers/core/api-keys.query'
import { ApiKeyCard } from '@/modules/developers/ui/api-key-card'
import { useFormatLocale } from '@/modules/workspaces/ui/hooks/use-format-locale'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { ListSkeleton } from '@/ui/components/list-skeleton'
import { LoadError, RefetchError } from '@/ui/components/load-error'
import { PageHeader } from '@/ui/components/page-header'

export function DevelopersPage() {
  const { t } = useTranslation()
  const { workspace } = useMe()
  const locale = useFormatLocale()
  const keys = useQuery(apiKeysQuery(workspace.id))
  const retry = () => void keys.refetch()

  return (
    <>
      <PageHeader title={t('developers.title')} description={t('developers.description')} />
      {keys.isRefetchError && (
        <RefetchError error={keys.error} onRetry={retry}>
          {t('developers.stale')}
        </RefetchError>
      )}
      {keys.data ? (
        apiKeyViews(keys.data, locale).map((view) => <ApiKeyCard key={view.mode} view={view} />)
      ) : keys.isLoadingError ? (
        <LoadError error={keys.error} onRetry={retry} />
      ) : (
        <ListSkeleton rows={2} />
      )}
    </>
  )
}
