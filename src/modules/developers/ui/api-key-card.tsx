import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiKeyView } from '@/modules/developers/core/api-keys'
import { createApiKey, deleteApiKey } from '@/modules/developers/core/api-keys.mutation'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Callout } from '@/ui/components/callout'
import { CardHeading } from '@/ui/components/card-heading'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { CopyButton } from '@/ui/components/copy-button'
import { Facts } from '@/ui/components/facts'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'

type Confirmation = { action: 'replace' | 'delete'; keyId: string }

export function ApiKeyCard({ view }: { view: ApiKeyView }) {
  const { t } = useTranslation()
  const { mode, key } = view
  const { workspace } = useMe()
  const { client, pending, run } = useBetterAuthAction()
  const heading = useRef<HTMLHeadingElement>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [confirming, setConfirming] = useState(false)
  const confirm = (action: Confirmation['action'], keyId: string) => {
    setConfirmation({ action, keyId })
    setConfirming(true)
  }
  const create = (notice: string) =>
    run(async () => setSecret(await createApiKey(client, workspace.id, mode)), { notice })
  const remove = (keyId: string) =>
    run(
      async () => {
        await deleteApiKey(client, mode, keyId)
        setSecret(null)
      },
      { notice: 'developers.notices.deleted' }
    )

  return (
    <Card>
      <CardHeader>
        <CardHeading ref={heading} tabIndex={-1} className="outline-none">
          {t(`developers.keys.${mode}.title`)}
        </CardHeading>
        <CardDescription>{t(`developers.keys.${mode}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {secret && (
          <Callout tone="warning" title={t('developers.secret.title')}>
            <p>{t('developers.secret.description')}</p>
            <p>
              <code className="font-mono break-all text-foreground">{secret}</code>
            </p>
            <CopyButton text={secret} notice="developers.notices.copied" size="sm">
              {t('developers.secret.copy')}
            </CopyButton>
          </Callout>
        )}
        {key ? (
          <>
            <Facts
              className="sm:grid-cols-2"
              items={[
                {
                  label: t('developers.key.start'),
                  value: <code className="font-mono">{key.start}…</code>,
                },
                { label: t('developers.key.created'), value: key.created },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => confirm('replace', key.id)}>
                {t(`developers.keys.${mode}.replace`)}
              </Button>
              <Button variant="destructive" onClick={() => confirm('delete', key.id)}>
                {t(`developers.keys.${mode}.delete`)}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">{t(`developers.keys.${mode}.empty`)}</p>
            <Button
              className="justify-self-start"
              disabled={pending}
              onClick={() => void create('developers.notices.created')}
            >
              {t(`developers.keys.${mode}.create`)}
            </Button>
          </>
        )}
      </CardContent>
      {confirmation && (
        <ConfirmDialog
          open={confirming}
          title={t(`developers.confirm.${confirmation.action}.title.${mode}`)}
          description={t(`developers.confirm.${confirmation.action}.body`)}
          action={t(`developers.confirm.${confirmation.action}.action`)}
          pending={pending}
          onConfirm={async () => {
            const result = await (confirmation.action === 'replace'
              ? create('developers.notices.replaced')
              : remove(confirmation.keyId))
            if (result.ok) setConfirming(false)
          }}
          onClose={() => setConfirming(false)}
          returnTo={heading}
        />
      )}
    </Card>
  )
}
