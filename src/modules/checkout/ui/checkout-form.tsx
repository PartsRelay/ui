import { useForm } from '@tanstack/react-form'
import { cn } from 'cn'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CheckoutObject } from '@/core/api/models'
import { type Article, checkoutView, orderItems, pieces } from '@/modules/checkout/core/checkout'
import { useArticleName } from '@/modules/checkout/ui/hooks/use-article-name'
import { useDecideCheckout } from '@/modules/checkout/ui/hooks/use-decide-checkout'
import { QuantityStepper } from '@/modules/checkout/ui/quantity-stepper'
import { CardHeading } from '@/ui/components/card-heading'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { Form } from '@/ui/components/form'
import { SubmitButton } from '@/ui/components/submit-button'
import { Badge } from '@/ui/components/ui/badge'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/components/ui/card'

type CheckoutFormProps = { token: string; checkout: CheckoutObject }

export function CheckoutForm({ token, checkout }: CheckoutFormProps) {
  const { t } = useTranslation()
  const articleName = useArticleName()
  const decide = useDecideCheckout(token)
  const [declining, setDeclining] = useState(false)
  const { company, plate, vin, vehicleDescription, query } = checkout
  const { groups, articles } = checkoutView(checkout)
  const form = useForm({
    defaultValues: { quantities: articles.map(() => 0) },
    onSubmit: ({ value }) =>
      decide.mutateAsync(orderItems(articles, value.quantities)).catch(() => {}),
  })
  const row = (article: Article) => {
    const name = articleName(article)

    return (
      <li
        key={article.index}
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2.5',
          article.original && 'bg-muted/50'
        )}
      >
        <span className="grid min-w-0 gap-0.5">
          <span className="flex flex-wrap items-baseline gap-x-2 font-semibold tracking-wide">
            {name}
            {article.original && <Badge variant="outline">{t('checkout.original')}</Badge>}
          </span>
          {article.description && (
            <span className="text-muted-foreground">{article.description}</span>
          )}
        </span>
        <form.Field name={`quantities[${article.index}]`}>
          {(field) => (
            <QuantityStepper name={name} value={field.state.value} onChange={field.handleChange} />
          )}
        </form.Field>
      </li>
    )
  }

  return (
    <Form form={form} className="grid gap-6 pb-24">
      <header className="grid gap-2">
        <h1 className="font-heading text-2xl font-bold wrap-anywhere">
          {t('checkout.heading', { company })}
        </h1>
        <p className="text-muted-foreground">{t('checkout.description', { company })}</p>
        <p className="font-semibold wrap-anywhere">
          {[plate ?? vin, vehicleDescription, query].filter(Boolean).join(' · ')}
        </p>
      </header>
      {groups.map((group) => (
        <Card key={group.key}>
          {group.name && (
            <CardHeader>
              <CardHeading>{group.name}</CardHeading>
            </CardHeader>
          )}
          <CardContent className="grid gap-3">
            {group.parts.map((part) => (
              <ul key={part.key} className="divide-y overflow-hidden rounded-lg border">
                {part.articles.map(row)}
              </ul>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <form.Subscribe selector={(state) => pieces(state.values.quantities)}>
            {(count) => (
              <>
                <p role="status" className="font-semibold">
                  {t('checkout.selected', { count })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={decide.isPending}
                    onClick={() => setDeclining(true)}
                  >
                    {t('checkout.cancel')}
                  </Button>
                  <SubmitButton form={form} disabled={count === 0 || decide.isPending}>
                    {t('checkout.confirm')}
                  </SubmitButton>
                </div>
              </>
            )}
          </form.Subscribe>
        </div>
      </div>
      <ConfirmDialog
        open={declining}
        title={t('checkout.decline.title')}
        description={t('checkout.decline.description', { company })}
        action={t('checkout.cancel')}
        pending={decide.isPending}
        onClose={() => setDeclining(false)}
        onConfirm={() => decide.mutate(undefined, { onSettled: () => setDeclining(false) })}
      />
    </Form>
  )
}
