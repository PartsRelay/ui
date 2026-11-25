import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { subscriptionView } from '@/modules/billing/core/subscription'
import { openPortal, startCheckout } from '@/modules/billing/core/subscription.mutation'
import { subscriptionQuery } from '@/modules/billing/core/subscription.query'
import { useFormatLocale } from '@/modules/workspaces/ui/hooks/use-format-locale'
import { CardHeading } from '@/ui/components/card-heading'
import { LoadError } from '@/ui/components/load-error'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'

const CONFIRM_EVERY_MS = 3000

export function CompanySubscription({ workspaceId }: { workspaceId: string }) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { pending, run } = useBetterAuthAction()
  // Polar comes back with the checkout it just closed
  const paid = useSearch({ strict: false, select: (search) => 'checkout_id' in search })
  const subscriptions = useQuery({
    ...subscriptionQuery(workspaceId),
    refetchInterval: ({ state }) => (paid && state.data?.length === 0 ? CONFIRM_EVERY_MS : false),
  })

  if (subscriptions.isLoadingError) {
    return (
      <Card>
        <CardHeader>
          <CardHeading>{t('billing.title')}</CardHeading>
        </CardHeader>
        <CardContent>
          <LoadError error={subscriptions.error} onRetry={() => void subscriptions.refetch()} />
        </CardContent>
      </Card>
    )
  }
  if (!subscriptions.data) return null

  const view = subscriptionView(subscriptions.data, locale)
  const confirming = paid && view.state === 'none'

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('billing.title')}</CardHeading>
        <CardDescription role={confirming ? 'status' : undefined}>
          {confirming
            ? t('billing.confirming')
            : t(
                view.state === 'none' || view.date ? `billing.${view.state}` : 'billing.undated',
                view
              )}
        </CardDescription>
      </CardHeader>
      {!confirming && (
        <CardContent>
          {view.state === 'none' ? (
            <Button disabled={pending} onClick={() => void run(() => startCheckout(workspaceId))}>
              {t('billing.subscribe')}
            </Button>
          ) : (
            <Button variant="outline" disabled={pending} onClick={() => void run(openPortal)}>
              {t('billing.manage')}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
