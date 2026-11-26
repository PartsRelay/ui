import { useTranslation } from 'react-i18next'
import type { CheckoutObject } from '@/core/api/models'
import { orderedByVehicle } from '@/modules/checkout/core/checkout'
import { useArticleName } from '@/modules/checkout/ui/hooks/use-article-name'
import { CardHeading } from '@/ui/components/card-heading'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function CheckoutClosed({ checkout }: { checkout: CheckoutObject }) {
  const { t } = useTranslation()
  const articleName = useArticleName()
  const { status, company, chatUrl } = checkout
  const vehicles = orderedByVehicle(checkout)

  return (
    <Card>
      <CardHeader>
        <CardHeading level={1}>{t(`checkout.${status}.title`)}</CardHeading>
        <CardDescription>
          {t(`checkout.${status}.description${chatUrl ? '' : '-web'}`, { company })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {vehicles.length > 0 && (
          <section className="grid gap-3">
            <h2 className="font-heading font-semibold">{t('checkout.ordered')}</h2>
            {vehicles.map((vehicle) => (
              <div key={vehicle.key} className="grid gap-2">
                <h3 className="text-sm font-semibold wrap-anywhere">{vehicle.title}</h3>
                <ul className="divide-y rounded-lg border">
                  {vehicle.items.map((item, index) => (
                    <li key={index} className="grid gap-0.5 px-3 py-2.5">
                      <span className="font-semibold tracking-wide">
                        {t('checkout.item', { quantity: item.quantity, name: articleName(item) })}
                      </span>
                      {item.description && (
                        <span className="text-muted-foreground">{item.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
        {chatUrl && (
          <Button asChild>
            <a href={chatUrl} rel="noreferrer">
              {t('checkout.back')}
            </a>
          </Button>
        )}
        <p className="text-center text-sm text-muted-foreground">{t('checkout.close')}</p>
      </CardContent>
    </Card>
  )
}
