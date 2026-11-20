import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon, ListChecksIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LookupPreviewObject } from '@/core/api/models'
import {
  emptyLookup,
  identifierSchemas,
  identifiers,
  type LookupPrefill,
  type LookupValues,
  lookupFieldErrors,
  newLookup,
  querySchema,
  toIdentifier,
} from '@/modules/lookups/core/lookup-form'
import { previewFieldErrors } from '@/modules/lookups/core/parts-preview'
import { PartsReview } from '@/modules/lookups/ui/parts-review'
import { usePreviewLookup } from '@/modules/lookups/ui/hooks/use-preview-lookup'
import { useStartLookup } from '@/modules/lookups/ui/hooks/use-start-lookup'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Callout } from '@/ui/components/callout'
import { ChoiceGroup } from '@/ui/components/choice-group'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { Button } from '@/ui/components/ui/button'
import { FieldGroup } from '@/ui/components/ui/field'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/ui/sheet'
import { useFlag } from '@/ui/hooks/use-flag'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'

type NewLookupSheetProps = { open: boolean; prefill: LookupPrefill; onClose: () => void }

export function NewLookupSheet({ open, prefill, onClose }: NewLookupSheetProps) {
  const returnFocus = useReturnFocus(open)

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        onCloseAutoFocus={returnFocus}
        className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <NewLookup prefill={prefill} />
      </SheetContent>
    </Sheet>
  )
}

type Preview = { values: LookupValues; result: LookupPreviewObject }

function NewLookup({ prefill }: { prefill: LookupPrefill }) {
  const checkParts = useFlag('parts-preview')
  const [values, setValues] = useState(() => emptyLookup(prefill))
  const [preview, setPreview] = useState<Preview | null>(null)

  if (preview) {
    return (
      <PartsReview
        values={preview.values}
        preview={preview.result}
        onEdit={() => setPreview(null)}
      />
    )
  }

  return (
    <NewLookupForm
      values={values}
      checkParts={checkParts}
      onPreview={(next) => {
        setValues(next.values)
        setPreview(next)
      }}
    />
  )
}

type NewLookupFormProps = {
  values: LookupValues
  checkParts: boolean
  onPreview: (preview: Preview) => void
}

function NewLookupForm({ values, checkParts, onPreview }: NewLookupFormProps) {
  const { t } = useTranslation()
  const { me } = useMe()
  const navigate = useNavigate()
  const start = useStartLookup()
  const check = usePreviewLookup()
  const form = useForm({
    defaultValues: values,
    onSubmit: async ({ value, formApi }) => {
      if (checkParts) {
        try {
          onPreview({ values: value, result: await check.mutateAsync(newLookup(value)) })
        } catch (error) {
          const fields = previewFieldErrors(error)
          if (fields) formApi.setErrorMap({ onSubmit: { fields } })
        }
        return
      }

      try {
        const { id } = await start.mutateAsync(newLookup(value))
        await navigate({
          to: '/lookups/$lookupId',
          params: { lookupId: String(id) },
          replace: true,
        })
      } catch (error) {
        const fields = lookupFieldErrors(error)
        if (fields) formApi.setErrorMap({ onSubmit: { fields } })
      }
    },
  })

  return (
    <Form form={form} className="flex min-h-full flex-col">
      <SheetHeader className="gap-2 p-6 pr-12">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          {t('lookups.new.eyebrow')}
        </p>
        <SheetTitle className="text-2xl font-semibold">{t('lookups.new.title')}</SheetTitle>
        <SheetDescription>{t('lookups.new.description')}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-6 px-6 pb-6">
        <FieldGroup>
          <form.Field name="by">
            {(field) => (
              <ChoiceGroup
                aria-label={t('lookups.new.identify')}
                options={identifiers.map((by) => ({ value: by, label: t(`lookups.new.by.${by}`) }))}
                value={field.state.value}
                onValueChange={(value) => {
                  const by = toIdentifier(value)
                  if (by) field.handleChange(by)
                }}
              />
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.values.by}>
            {(by) => (
              <form.Field key={by} name={by} validators={{ onSubmit: identifierSchemas[by] }}>
                {(field) => (
                  <InputField
                    field={field}
                    label={t(`lookups.new.${by}`)}
                    required
                    description={t(`lookups.new.${by}-hint`)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder={t(`lookups.new.${by}-placeholder`)}
                    className="uppercase placeholder:normal-case"
                  />
                )}
              </form.Field>
            )}
          </form.Subscribe>
          <form.Field name="query" validators={{ onSubmit: querySchema }}>
            {(field) => (
              <InputField
                field={field}
                label={t('lookups.new.query')}
                required
                description={t('lookups.new.query-hint')}
                autoComplete="off"
                placeholder={t('lookups.new.query-placeholder')}
              />
            )}
          </form.Field>
        </FieldGroup>
        <Callout title={t('lookups.new.tips.title')}>{t('lookups.new.tips.body')}</Callout>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>{t('lookups.new.requester', { name: me.member.name })}</p>
          <p>{t('lookups.fitment')}</p>
        </div>
      </div>
      <SheetFooter className="flex-row justify-end border-t p-6">
        <SheetClose asChild>
          <Button variant="outline">{t('confirm.cancel')}</Button>
        </SheetClose>
        <SubmitButton form={form}>
          {checkParts ? t('lookups.new.check') : t('lookups.new.submit')}
          {checkParts ? (
            <ListChecksIcon data-icon="inline-end" />
          ) : (
            <ArrowRightIcon data-icon="inline-end" />
          )}
        </SubmitButton>
      </SheetFooter>
    </Form>
  )
}
