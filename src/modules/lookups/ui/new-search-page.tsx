import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, Navigate } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CarIcon,
  CircleAlertIcon,
  ImagePlusIcon,
  PackageSearchIcon,
  ScanTextIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LookupMessageObject } from '@/core/api/models'
import { lookupQuery } from '@/modules/lookups/core/lookups.query'
import {
  addImages,
  IMAGE_TYPES,
  messageError,
  messageOf,
  readOfLookup,
  searchTrace,
  type TraceStep,
} from '@/modules/lookups/core/message-search'
import { useSearchMessage } from '@/modules/lookups/ui/hooks/use-search-message'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { CardHeading } from '@/ui/components/card-heading'
import { ListSkeleton } from '@/ui/components/list-skeleton'
import { PageHeader } from '@/ui/components/page-header'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/ui/components/ui/attachment'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/ui/components/ui/input-group'
import { Spinner } from '@/ui/components/ui/spinner'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/ui/components/ui/trace'
import { useFlag, useFlagsLoaded } from '@/ui/hooks/use-flag'

const route = getRouteApi('/_app/(lookups)/lookups/new')

const ICONS = { read: ScanTextIcon, vehicle: CarIcon, search: PackageSearchIcon }

function StepIcon({ step }: { step: TraceStep }) {
  const Icon =
    step.status === 'error'
      ? CircleAlertIcon
      : (ICONS[step.key as keyof typeof ICONS] ?? ScanTextIcon)

  return (
    <TraceIcon>
      <Icon />
    </TraceIcon>
  )
}

function Step({ step }: { step: TraceStep }) {
  const { t } = useTranslation()
  const line = (
    <TraceLine status={step.status}>
      <StepIcon step={step} />
      <TraceTitle>{t(...step.title)}</TraceTitle>
    </TraceLine>
  )

  if (!step.description) return line

  return (
    <TraceCollapsible defaultOpen>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>{step.description}</TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

type Picked = { file: File; url: string }

function ImageChip({ image, onRemove }: { image: Picked; onRemove: () => void }) {
  const { t } = useTranslation()

  return (
    <Attachment size="sm">
      <AttachmentMedia variant="image">
        <img src={image.url} alt="" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle className="max-w-40">{image.file.name}</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          aria-label={t('lookups.ai.remove', { name: image.file.name })}
          onClick={onRemove}
        >
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
}

// On a phone the steps are under the request: bring them into view
function showTrace(section: HTMLElement | null) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  section?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
}

export function NewSearchPage() {
  const aiSearch = useFlag('ai-search')
  const loaded = useFlagsLoaded()
  const { plate, vin, query } = route.useSearch()

  if (aiSearch) return <MessageSearch />

  return loaded ? (
    <Navigate to="/lookups" search={{ new: true, plate, vin, query }} replace />
  ) : (
    <ListSkeleton />
  )
}

function MessageSearch() {
  const { t } = useTranslation()
  const { me } = useMe()
  const id = useId()
  const navigate = route.useNavigate()
  const { plate, vin, query, lookupId: kept } = route.useSearch()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const traceSection = useRef<HTMLElement>(null)
  const [text, setText] = useState(() => messageOf({ plate, vin, query }))
  const [images, setImages] = useState<Picked[]>([])
  const shown = useRef(images)
  const [refused, setRefused] = useState(0)
  const [empty, setEmpty] = useState(false)
  const search = useSearchMessage()
  const lookupId = search.data ? search.data.lookup?.id : kept
  const lookup = useQuery({
    ...lookupQuery(lookupId ?? 0),
    enabled: lookupId !== undefined,
    refetchInterval: (state) => (state.state.data?.data.status === 'running' ? 2000 : false),
  })
  const current = lookup.data ?? search.data?.lookup ?? undefined
  const read: LookupMessageObject | undefined =
    search.data ?? (current && !search.isPending ? readOfLookup(current) : undefined)
  const steps = searchTrace({
    sending: search.isPending,
    error: search.error,
    read,
    lookup: current,
  })
  const error = empty ? (['lookups.ai.errors.empty'] as const) : messageError(search.error)

  useEffect(() => {
    shown.current = images
  })
  useEffect(() => () => shown.current.forEach(({ url }) => URL.revokeObjectURL(url)), [])

  const attach = ({ currentTarget }: ChangeEvent<HTMLInputElement>) => {
    const next = addImages(
      images.map(({ file }) => file),
      [...(currentTarget.files ?? [])]
    )
    const urls = new Map(images.map((image) => [image.file, image.url]))
    setImages(
      next.images.map((file) => ({ file, url: urls.get(file) ?? URL.createObjectURL(file) }))
    )
    setRefused(next.refused)
    currentTarget.value = ''
  }

  const remove = (index: number) => {
    URL.revokeObjectURL(images[index].url)
    setImages(images.filter((_, other) => other !== index))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = text.trim()

    if (!message && images.length === 0) {
      setEmpty(true)
      textarea.current?.focus()
      return
    }

    setEmpty(false)
    showTrace(traceSection.current)
    search.mutate(
      {
        ...(message && { message }),
        ...(images.length > 0 && { images: images.map(({ file }) => file) }),
      },
      {
        onSuccess: ({ lookup: started }) =>
          void navigate({
            search: (prev) => ({ ...prev, lookupId: started?.id }),
            replace: true,
            resetScroll: false,
          }),
      }
    )
  }

  return (
    <>
      <PageHeader
        title={t('lookups.ai.title')}
        description={t('lookups.ai.description')}
        action={
          <Button variant="outline" asChild>
            <Link to="/lookups">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('lookups.detail.back')}
            </Link>
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <form onSubmit={submit} noValidate className="grid gap-4">
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor={`${id}-message`}>{t('lookups.ai.message')}</FieldLabel>
                <InputGroup>
                  {images.length > 0 && (
                    <InputGroupAddon align="block-start">
                      <AttachmentGroup>
                        {images.map((image, index) => (
                          <ImageChip key={image.url} image={image} onRemove={() => remove(index)} />
                        ))}
                      </AttachmentGroup>
                    </InputGroupAddon>
                  )}
                  <InputGroupTextarea
                    ref={textarea}
                    id={`${id}-message`}
                    value={text}
                    rows={6}
                    maxLength={2000}
                    autoFocus
                    placeholder={t('lookups.ai.message-placeholder')}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
                    onChange={({ currentTarget }) => setText(currentTarget.value)}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupButton
                      size="icon-sm"
                      aria-label={t('lookups.ai.attach')}
                      onClick={() => fileInput.current?.click()}
                    >
                      <ImagePlusIcon />
                    </InputGroupButton>
                    <input
                      ref={fileInput}
                      type="file"
                      accept={IMAGE_TYPES.join(',')}
                      multiple
                      hidden
                      aria-label={t('lookups.ai.attach')}
                      onChange={attach}
                    />
                    <InputGroupButton
                      type="submit"
                      variant="default"
                      size="sm"
                      className="ml-auto"
                      aria-disabled={search.isPending}
                    >
                      {search.isPending ? <Spinner /> : <SearchIcon />}
                      {t('lookups.ai.send')}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription id={`${id}-hint`}>
                  {t('lookups.ai.message-hint')}
                </FieldDescription>
                {refused > 0 && (
                  <FieldDescription>{t('lookups.ai.refused', { count: refused })}</FieldDescription>
                )}
                {error && <FieldError id={`${id}-error`}>{t(...error)}</FieldError>}
              </Field>
              <p className="text-sm text-muted-foreground">
                {t('lookups.new.requester', { name: me.member.name })}
              </p>
            </form>
          </CardContent>
        </Card>
        <section ref={traceSection} aria-labelledby={`${id}-trace`} aria-live="polite">
          <Card>
            <CardHeader>
              <CardHeading id={`${id}-trace`}>{t('lookups.ai.trace-label')}</CardHeading>
              {steps.length === 0 && (
                <CardDescription>{t('lookups.ai.trace-empty')}</CardDescription>
              )}
            </CardHeader>
            {steps.length > 0 && (
              <CardContent className="grid gap-4">
                <Trace>
                  {steps.map((step) => (
                    <Step key={step.key} step={step} />
                  ))}
                </Trace>
                {current && current.status !== 'running' && (
                  <Button asChild className="w-fit">
                    <Link to="/lookups/$lookupId" params={{ lookupId: String(current.id) }}>
                      {t('lookups.ai.open')}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        </section>
      </div>
    </>
  )
}
