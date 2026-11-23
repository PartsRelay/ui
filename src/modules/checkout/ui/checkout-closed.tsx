import { useTranslation } from 'react-i18next'
import type { CheckoutObject } from '@/core/api/models'
import { useArticleName } from '@/modules/checkout/ui/hooks/use-article-name'
import { CardHeading } from '@/ui/components/card-heading'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function CheckoutClosed({ checkout }: { checkout: CheckoutObject }) {
  const { t } = useTranslation()
  const articleName = useArticleName()
  const { status, company, chatUrl, items } = checkout

  return (
    <Card>
      <CardHeader>
        <CardHeading level={1}>{t(`checkout.${status}.title`)}</CardHeading>
        <CardDescription>{t(`checkout.${status}.description`, { company })}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {items.length > 0 && (
          <section className="grid gap-2">
            <h2 className="font-heading font-semibold">{t('checkout.ordered')}</h2>
            <ul className="divide-y rounded-lg border">
              {items.map((item, index) => (
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
