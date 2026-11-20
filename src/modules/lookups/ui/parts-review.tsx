import { useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon, CircleCheckIcon, CircleSlashIcon, PencilIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { LookupPreviewObject } from '@/core/api/models'
import { type LookupValues, compactIdentifier, newLookup } from '@/modules/lookups/core/lookup-form'
import { partsPreview, withParts } from '@/modules/lookups/core/parts-preview'
import { useStartLookup } from '@/modules/lookups/ui/hooks/use-start-lookup'
import { Callout } from '@/ui/components/callout'
import { Facts } from '@/ui/components/facts'
import { Button } from '@/ui/components/ui/button'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/ui/components/ui/item'
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/ui/components/ui/sheet'
import { Spinner } from '@/ui/components/ui/spinner'

type PartsReviewProps = {
  values: LookupValues
  preview: LookupPreviewObject
  onEdit: () => void
}

export function PartsReview({ values, preview, onEdit }: PartsReviewProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const start = useStartLookup()
  const heading = useRef<HTMLHeadingElement>(null)
  const view = partsPreview(preview)

  useEffect(() => heading.current?.focus(), [])

  const startSearch = async () => {
    if (start.isPending) return

    const { id } = await start.mutateAsync(withParts(newLookup(values), view.nodeIds))
    await navigate({
      to: '/lookups/$lookupId',
      params: { lookupId: String(id) },
      replace: true,
    })
  }

  return (
    <div className="flex min-h-full flex-col">
      <SheetHeader className="gap-2 p-6 pr-12">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          {t('lookups.preview.eyebrow')}
        </p>
        <SheetTitle ref={heading} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {t('lookups.preview.title')}
        </SheetTitle>
        <SheetDescription>{t('lookups.preview.description')}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-6 px-6 pb-6">
        <Facts
          className="grid-cols-2"
          items={[
            {
              label: t(`lookups.new.${values.by}`),
              value: compactIdentifier(values[values.by]),
            },
            { label: t('lookups.preview.vehicle'), value: view.vehicle ?? '-' },
          ]}
        />
        <section aria-labelledby="preview-parts" className="grid gap-3">
          <h3 id="preview-parts" className="text-sm font-semibold">
            {t('lookups.preview.parts')}
          </h3>
          <ul className="grid gap-2">
            {view.parts.map((part, index) => (
              <li key={index}>
                <Item variant="outline" size="sm">
                  <ItemMedia>
                    {part.found ? (
                      <CircleCheckIcon aria-hidden className="text-primary" />
                    ) : (
                      <CircleSlashIcon aria-hidden className="text-muted-foreground" />
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="wrap-anywhere">{part.name}</ItemTitle>
                    <ItemDescription className="line-clamp-none">
                      {part.found ? t(...part.found) : t('lookups.preview.missing')}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </li>
            ))}
          </ul>
        </section>
        {view.notice && (
          <Callout tone={view.notice.tone} title={view.notice.title && t(...view.notice.title)}>
            {t(...view.notice.body)}
          </Callout>
        )}
      </div>
      <SheetFooter className="flex-row flex-wrap justify-end border-t p-6">
        <Button variant="outline" onClick={onEdit}>
          <PencilIcon data-icon="inline-start" />
          {t('lookups.preview.edit')}
        </Button>
        <Button
          disabled={!view.canStart}
          aria-disabled={start.isPending}
          className="aria-disabled:opacity-50"
          onClick={() => void startSearch().catch(() => undefined)}
        >
          {start.isPending && <Spinner data-icon="inline-start" />}
          {t('lookups.preview.start')}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </SheetFooter>
    </div>
  )
}
