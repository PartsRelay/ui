import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { countryFlag, countryName, toCountry } from '@/modules/workspaces/core/country'
import { CountrySelect } from '@/modules/workspaces/ui/country-select'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { SelectItem } from '@/ui/components/ui/select'

const COMPANY = 'company'

export function CountryCard() {
  const { t, i18n } = useTranslation()
  const { session, workspace } = useMe()
  const { client, pending, run } = useBetterAuthAction()
  const country = toCountry(session.user.country)

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('profile.country.title')}</CardHeading>
        <CardDescription>{t('profile.country.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <CountrySelect
          label={t('profile.country.label')}
          value={country ?? COMPANY}
          disabled={pending}
          onValueChange={(value) => {
            const next = value === COMPANY ? null : value
            if (next === country) return

            void run(
              async () => {
                await authClient.updateUser({ country: next })
                await client.invalidateQueries({ queryKey: sessionQuery.queryKey })
              },
              next
                ? {
                    notice: 'profile.notices.country',
                    values: { country: countryName(next, i18n.language) },
                  }
                : { notice: 'profile.notices.company-country' }
            )
          }}
        >
          {workspace.country && (
            <SelectItem value={COMPANY}>
              {t('profile.country.company', {
                country: `${countryFlag(workspace.country)} ${countryName(workspace.country, i18n.language)}`,
              })}
            </SelectItem>
          )}
        </CountrySelect>
      </CardContent>
    </Card>
  )
}
