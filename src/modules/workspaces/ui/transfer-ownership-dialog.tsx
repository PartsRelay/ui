import { useForm, useSelector } from '@tanstack/react-form'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WorkspaceMemberObject } from '@/core/api/models'
import { optionsKey } from '@/core/options.query'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { memberOptionsQuery } from '@/modules/workspaces/core/members.query'
import { roleLabel, toRole } from '@/modules/workspaces/core/role'
import { transferAction, transferRoles } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { AutocompleteField } from '@/ui/components/autocomplete-field'
import { Form } from '@/ui/components/form'
import { SubmitButton } from '@/ui/components/submit-button'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/ui/alert-dialog'

type TransferOwnershipDialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

export function TransferOwnershipDialog({ open, onOpenChange }: TransferOwnershipDialogProps) {
  const returnFocus = useReturnFocus(open)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={returnFocus}>
        <TransferForm onDone={() => onOpenChange(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function TransferForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const candidates = useInfiniteQuery(
    memberOptionsQuery({ role: transferRoles, search: search || undefined })
  )
  const nobody = !search && candidates.data?.pages[0].metadata.total === 0
  const { client, run } = useBetterAuthAction()
  const form = useForm({
    defaultValues: { candidate: null as WorkspaceMemberObject | null },
    onSubmit: async ({ value: { candidate } }) => {
      if (!candidate) return

      const result = await run(
        async () => {
          try {
            await authClient.organization.updateMemberRole({
              memberId: String(candidate.id),
              role: 'owner',
            })
          } finally {
            await Promise.all([
              client.invalidateQueries({ queryKey: workspaceKey }),
              client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
              client.invalidateQueries({ queryKey: optionsKey }),
            ])
          }
        },
        { notice: 'workspace.notices.ownership-transferred', values: { name: candidate.name } }
      )
      if (result.ok) onDone()
    },
  })
  const candidate = useSelector(form.store, (state) => state.values.candidate)
  const candidateLabel = (member: WorkspaceMemberObject) =>
    t('workspace.transfer.candidate', {
      name: member.name,
      role: t(...roleLabel(toRole(member.role))),
    })

  return (
    <Form form={form} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle>{t('workspace.transfer.title')}</AlertDialogTitle>
        <AlertDialogDescription>
          {t(nobody ? 'workspace.transfer.nobody' : 'workspace.transfer.description')}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {!nobody && (
        <form.Field name="candidate">
          {(field) => (
            <AutocompleteField
              label={t('workspace.transfer.new-owner')}
              placeholder={t('workspace.transfer.choose')}
              value={field.state.value}
              groups={[{ items: candidates.data?.pages.flatMap(({ data }) => data) ?? [] }]}
              pages={candidates}
              itemKey={(member) => String(member.id)}
              itemLabel={candidateLabel}
              onValueChange={field.handleChange}
              onSearch={setSearch}
            />
          )}
        </form.Field>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
        <SubmitButton
          form={form}
          className="h-auto min-h-8 min-w-0 shrink whitespace-normal wrap-anywhere"
          disabled={!candidate}
        >
          {t(...transferAction(candidate ?? undefined))}
        </SubmitButton>
      </AlertDialogFooter>
    </Form>
  )
}
