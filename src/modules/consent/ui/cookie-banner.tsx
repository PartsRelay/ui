import { type ComponentProps, useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { env } from '@/env'
import {
  answerCookiebot,
  categories,
  type Choices,
  choose,
  watchCookiebot,
} from '@/modules/consent/core/cookiebot'
import { ExternalLink } from '@/ui/components/external-link'
import { Button } from '@/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/ui/components/ui/field'
import { Switch } from '@/ui/components/ui/switch'

function Category({ name, ...props }: { name: string } & ComponentProps<typeof Switch>) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{t(`consent.categories.${name}.title`)}</FieldLabel>
        <FieldDescription>{t(`consent.categories.${name}.description`)}</FieldDescription>
      </FieldContent>
      <Switch id={id} {...props} />
    </Field>
  )
}

export function CookieBanner() {
  const { t } = useTranslation()
  const title = useId()
  const [choices, setChoices] = useState<Choices>()
  const [custom, setCustom] = useState(false)

  useEffect(() => watchCookiebot(setChoices), [])

  if (!choices) return null

  const answer = (answer: Choices) => {
    answerCookiebot(answer)
    setChoices(undefined)
    setCustom(false)
  }

  return (
    <Card
      role="dialog"
      aria-labelledby={title}
      size="sm"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto shadow-lg"
    >
      <CardHeader>
        <CardTitle id={title}>{t('consent.title')}</CardTitle>
        <CardDescription>
          {t('consent.description')}{' '}
          {env.PRIVACY_URL && (
            <ExternalLink href={env.PRIVACY_URL} className="underline">
              {t('app.legal.privacy')}
            </ExternalLink>
          )}
        </CardDescription>
      </CardHeader>
      {custom && (
        <CardContent className="grid gap-4">
          <Category name="necessary" checked disabled />
          {categories.map((name) => (
            <Category
              key={name}
              name={name}
              checked={choices[name]}
              onCheckedChange={(checked) => setChoices({ ...choices, [name]: checked })}
            />
          ))}
        </CardContent>
      )}
      <CardFooter className="flex-wrap justify-end gap-2">
        {custom ? (
          <Button variant="ghost" onClick={() => answer(choices)}>
            {t('consent.save')}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setCustom(true)}>
            {t('consent.customize')}
          </Button>
        )}
        <Button variant="outline" onClick={() => answer(choose(false))}>
          {t('consent.reject')}
        </Button>
        <Button onClick={() => answer(choose(true))}>{t('consent.accept')}</Button>
      </CardFooter>
    </Card>
  )
}
