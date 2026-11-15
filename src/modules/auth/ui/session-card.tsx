import { LogOutIcon, MonitorSmartphoneIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { env } from '@/env'
import { useSignOut } from '@/modules/auth/ui/hooks/use-sign-out'
import { Button } from '@/ui/components/ui/button'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function SessionCard() {
  const { t } = useTranslation()
  const { pending, signOut } = useSignOut({ to: '/login' })

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('profile.session.title')}</CardHeading>
        <CardDescription>{t('profile.session.description', { app: env.APP_NAME })}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => void signOut()}>
          <LogOutIcon data-icon="inline-start" />
          {t('profile.session.sign-out')}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => void signOut(true)}>
          <MonitorSmartphoneIcon data-icon="inline-start" />
          {t('profile.session.sign-out-everywhere')}
        </Button>
      </CardContent>
    </Card>
  )
}
