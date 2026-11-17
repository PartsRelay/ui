import { useTranslation } from 'react-i18next'
import { type Country, countryName } from '@/modules/workspaces/core/country'
import { updateCompany } from '@/modules/workspaces/core/workspace.mutation'
import { CountrySelect } from '@/modules/workspaces/ui/country-select'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function CompanyCountry({ country }: { country: Country | null }) {
  const { t, i18n } = useTranslation()
  const { client, pending, run } = useBetterAuthAction()

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('company.country.title')}</CardHeading>
        <CardDescription>{t('company.country.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <CountrySelect
          label={t('company.country.label')}
          value={country ?? ''}
          disabled={pending}
          onValueChange={(next) => {
            if (next === country) return

            void run(() => updateCompany(client, { country: next }), {
              notice: 'company.notices.country',
              values: { country: countryName(next, i18n.language) },
            })
          }}
        />
      </CardContent>
    </Card>
  )
}
