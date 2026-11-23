import { useTranslation } from 'react-i18next'
import { greeting } from '@/modules/lookups/core/lookup-stats'
import { LookupQueue } from '@/modules/lookups/ui/lookup-queue'
import { LookupStats } from '@/modules/lookups/ui/lookup-stats'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PageHeader } from '@/ui/components/page-header'

export function LookupsPage() {
  const { t } = useTranslation()
  const { me } = useMe()

  return (
    <>
      <PageHeader
        title={t(...greeting(me.member.name, new Date()))}
        description={t('lookups.description')}
        action={<NewLookupButton />}
      />
      {me.permissions.viewStats && <LookupStats />}
      <LookupQueue />
    </>
  )
}
