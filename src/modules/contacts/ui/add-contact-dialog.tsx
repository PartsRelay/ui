import { useForm } from '@tanstack/react-form'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  contactFieldErrors,
  emptyContact,
  MAX_COMPANIES,
  newContact,
  phoneExample,
  phoneSchema,
  withFixedPlus,
  withPlus,
} from '@/modules/contacts/core/contact-form'
import { useAddContact } from '@/modules/contacts/ui/hooks/use-add-contact'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { Button } from '@/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/components/ui/dialog'
import { FieldGroup } from '@/ui/components/ui/field'
import { useFlag } from '@/ui/hooks/use-flag'

export function AddContactDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          {t('contacts.add.open')}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <AddContactForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddContactForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const add = useAddContact()
  const { workspace } = useMe()
  const phoneInput = useFlag('phone-input')
  const typed = phoneInput ? withPlus : withFixedPlus
  const example = phoneInput ? phoneExample(workspace.country) : null
  const form = useForm({
    defaultValues: emptyContact(phoneInput),
    onSubmit: async ({ value, formApi }) => {
      try {
        await add.mutateAsync(newContact(value))
        onDone()
      } catch (error) {
        const fields = contactFieldErrors(error)
        if (fields) formApi.setErrorMap({ onSubmit: { fields } })
      }
    },
  })

  return (
    <Form form={form} className="grid gap-6">
      <DialogHeader>
        <DialogTitle>{t('contacts.add.title')}</DialogTitle>
        <DialogDescription>
          {t('contacts.add.description', { max: MAX_COMPANIES })}
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <form.Field name="phone" validators={{ onSubmit: phoneSchema }}>
          {(field) => (
            <InputField
              field={field}
              label={t('contacts.add.phone')}
              required
              description={
                example
                  ? t('contacts.add.phone-prefix-hint', { prefix: example.prefix })
                  : t('contacts.add.phone-hint')
              }
              type="tel"
              autoFocus
              autoComplete="off"
              placeholder={example?.number ?? undefined}
              onInput={({ currentTarget: input }) => {
                const value = typed(input.value)
                if (value === input.value) return
                const caret = typed(input.value.slice(0, input.selectionStart ?? 0)).length
                input.value = value
                input.setSelectionRange(caret, caret)
              }}
            />
          )}
        </form.Field>
        <form.Field name="name">
          {(field) => (
            <InputField
              field={field}
              label={t('contacts.add.name')}
              description={t('contacts.add.name-hint')}
              autoComplete="off"
            />
          )}
        </form.Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">{t('confirm.cancel')}</Button>
        </DialogClose>
        <SubmitButton form={form}>{t('contacts.add.submit')}</SubmitButton>
      </DialogFooter>
    </Form>
  )
}
