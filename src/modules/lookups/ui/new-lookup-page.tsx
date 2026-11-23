import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { cn } from 'cn'
import {
  ArrowRightIcon,
  ArrowUpIcon,
  CarIcon,
  CircleAlertIcon,
  PackageSearchIcon,
  PaperclipIcon,
  RotateCcwIcon,
  ScanTextIcon,
  XIcon,
} from 'lucide-react'
import {
  type ChangeEvent,
  type FormEvent,
  Fragment,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import type {
  LookupMessageObject,
  LookupObject,
  PostApiV1LookupsMessageBody,
} from '@/core/api/models'
import { message } from '@/core/message'
import { lookupQuery } from '@/modules/lookups/core/lookups.query'
import {
  addImages,
  assistantReply,
  IMAGE_TYPES,
  MAX_MESSAGE_LENGTH,
  messageOf,
  readOfLookup,
  requestOfLookup,
  retryable,
  searchTrace,
  threadRequest,
  type TraceStep,
} from '@/modules/lookups/core/message-search'
import { useSearchMessage } from '@/modules/lookups/ui/hooks/use-search-message'
import { LogoMark } from '@/ui/components/logo-mark'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/ui/components/ui/attachment'
import { Bubble, BubbleContent } from '@/ui/components/ui/bubble'
import { Button } from '@/ui/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/ui/components/ui/input-group'
import { Message, MessageAvatar, MessageContent } from '@/ui/components/ui/message'
import { Skeleton } from '@/ui/components/ui/skeleton'
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

const route = getRouteApi('/_app/(lookups)/lookups/new')

const ICONS = { read: ScanTextIcon, vehicle: CarIcon, search: PackageSearchIcon }

const EXAMPLES = ['brakes', 'filters', 'clutch'] as const

// Closer than this to the end, the chat follows new messages
const FOLLOW_PX = 96

type Picked = { file: File; url: string }

type Reply =
  | { state: 'sending' }
  | { state: 'failed'; error: unknown }
  | { state: 'read'; read: LookupMessageObject }

type Turn = {
  id: number
  text: string
  images: Picked[]
  body: PostApiV1LookupsMessageBody
  reply: Reply
}

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

function UserTurn({ text, images }: { text: string; images: Picked[] }) {
  const { t } = useTranslation()

  return (
    <article aria-label={t('lookups.ai.you')}>
      <Message align="end">
        <MessageContent>
          {images.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {images.map(({ file, url }) => (
                <img
                  key={url}
                  src={url}
                  alt={file.name}
                  className="size-24 rounded-xl border object-cover"
                />
              ))}
            </div>
          )}
          {text && (
            <Bubble variant="muted">
              <BubbleContent className="text-base whitespace-pre-wrap">{text}</BubbleContent>
            </Bubble>
          )}
        </MessageContent>
      </Message>
    </article>
  )
}

function AssistantTurn({ reply, onRetry }: { reply: Reply; onRetry?: () => void }) {
  const { t } = useTranslation()
  const read = reply.state === 'read' ? reply.read : undefined
  const error = reply.state === 'failed' ? reply.error : undefined
  const lookupId = read?.lookup?.id
  const polled = useQuery({
    ...lookupQuery(lookupId ?? 0),
    enabled: lookupId !== undefined,
    refetchInterval: ({ state }) => (state.data?.data.status === 'running' ? 2000 : false),
  })
  const lookup = polled.data ?? read?.lookup ?? undefined
  const steps = searchTrace({ sending: reply.state === 'sending', error, read, lookup })
  const answer = assistantReply({ error, read, lookup })

  return (
    <article aria-label={t('lookups.ai.assistant')}>
      <Message className="gap-3">
        <MessageAvatar className="size-8 self-start bg-transparent">
          <LogoMark className="h-7" />
        </MessageAvatar>
        <MessageContent className="gap-3 pt-1">
          <Trace>
            {steps.map((step) => (
              <Step key={step.key} step={step} />
            ))}
          </Trace>
          {answer && <p className="text-base leading-relaxed">{t(...answer)}</p>}
          {lookup && lookup.status !== 'running' && (
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link to="/lookups/$lookupId" params={{ lookupId: String(lookup.id) }}>
                {t('lookups.ai.open')}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          )}
          {onRetry && (
            <Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
              <RotateCcwIcon data-icon="inline-start" />
              {t('lookups.ai.retry')}
            </Button>
          )}
        </MessageContent>
      </Message>
    </article>
  )
}

// The search kept in the address, after a reload
function KeptSearch({ lookup }: { lookup: LookupObject }) {
  return (
    <>
      <UserTurn text={requestOfLookup(lookup)} images={[]} />
      <AssistantTurn reply={{ state: 'read', read: readOfLookup(lookup) }} />
    </>
  )
}

function KeptSkeleton() {
  return (
    <div className="grid gap-8" aria-hidden="true">
      <Skeleton className="ml-auto h-10 w-1/2 rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="grid flex-1 gap-2 pt-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export function NewLookupPage() {
  const { t } = useTranslation()
  const id = useId()
  const navigate = route.useNavigate()
  const { plate, vin, query, lookupId } = route.useSearch()
  const [keptId] = useState(lookupId)
  const kept = useQuery({ ...lookupQuery(keptId ?? 0), enabled: keptId !== undefined })
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const following = useRef(true)
  const [text, setText] = useState(() => messageOf({ plate, vin, query }))
  const [images, setImages] = useState<Picked[]>([])
  const shown = useRef(images)
  const [refused, setRefused] = useState(0)
  const [blank, setBlank] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const search = useSearchMessage()
  const restoring = keptId !== undefined && kept.isPending
  const started = turns.length > 0 || kept.data !== undefined || restoring
  const sending = turns.some(({ reply }) => reply.state === 'sending')
  const error = blank ? message('lookups.ai.errors.empty') : null
  const last = turns.at(-1)

  useEffect(() => {
    shown.current = [...images, ...turns.flatMap((turn) => turn.images)]
  })
  useEffect(() => () => shown.current.forEach(({ url }) => URL.revokeObjectURL(url)), [])

  // Keeps the newest message in view while the replies grow
  const follow = useCallback((log: HTMLElement | null) => {
    if (!log) return
    const page = document.documentElement
    const onScroll = () => {
      following.current = page.scrollHeight - window.scrollY - window.innerHeight < FOLLOW_PX
    }
    const observer = new ResizeObserver(() => {
      if (following.current && log.childElementCount > 0) {
        window.scrollTo({ top: page.scrollHeight })
      }
    })
    observer.observe(log)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const settle = (turnId: number, reply: Reply) =>
    setTurns((current) => current.map((turn) => (turn.id === turnId ? { ...turn, reply } : turn)))

  const ask = (turnId: number, body: PostApiV1LookupsMessageBody) => {
    following.current = true
    search.mutate(body, {
      onSuccess: (read) => {
        settle(turnId, { state: 'read', read })
        if (read.lookup) {
          void navigate({
            search: { lookupId: read.lookup.id },
            replace: true,
            resetScroll: false,
          })
        }
      },
      onError: (failure) => settle(turnId, { state: 'failed', error: failure }),
    })
  }

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
    setBlank(false)
    currentTarget.value = ''
  }

  const remove = (index: number) => {
    URL.revokeObjectURL(images[index].url)
    setImages(images.filter((_, other) => other !== index))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (sending) return

    const said = text.trim()
    if (!said && images.length === 0) {
      setBlank(true)
      textarea.current?.focus()
      return
    }

    const turnId = turns.length + 1
    const body = threadRequest([
      ...turns.map((turn) => ({
        text: turn.text,
        images: turn.images.map(({ file }) => file),
        started: turn.reply.state === 'read' && Boolean(turn.reply.read.lookup),
        failed: turn.reply.state === 'failed',
      })),
      { text: said, images: images.map(({ file }) => file) },
    ])
    setTurns([...turns, { id: turnId, text: said, images, body, reply: { state: 'sending' } }])
    setText('')
    setImages([])
    setRefused(0)
    setBlank(false)
    textarea.current?.focus()
    ask(turnId, body)
  }

  const retry = (turn: Turn) => {
    settle(turn.id, { state: 'sending' })
    ask(turn.id, turn.body)
  }

  // Enter sends, Shift+Enter starts a new line
  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const pickExample = (example: string) => {
    setText(example)
    setBlank(false)
    textarea.current?.focus()
  }

  return (
    <div
      className={cn(
        'mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-3xl flex-col',
        !started && 'justify-center gap-4 pb-[8svh]'
      )}
    >
      <header className={started ? 'sr-only' : 'grid justify-items-center gap-3 text-center'}>
        {!started && <LogoMark className="h-12" />}
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t('lookups.ai.title')}
        </h1>
        {!started && (
          <p className="max-w-xl text-balance text-muted-foreground">
            {t('lookups.ai.description')}
          </p>
        )}
      </header>
      <div
        ref={follow}
        role="log"
        aria-label={t('lookups.ai.conversation')}
        className={cn('flex flex-col gap-8', started && 'flex-1 pt-2 pb-8')}
      >
        {restoring && <KeptSkeleton />}
        {kept.data && <KeptSearch lookup={kept.data} />}
        {turns.map((turn) => (
          <Fragment key={turn.id}>
            <UserTurn text={turn.text} images={turn.images} />
            <AssistantTurn
              reply={turn.reply}
              onRetry={
                turn === last && turn.reply.state === 'failed' && retryable(turn.reply.error)
                  ? () => retry(turn)
                  : undefined
              }
            />
          </Fragment>
        ))}
      </div>
      <form
        onSubmit={submit}
        noValidate
        className={cn(
          started &&
            'sticky bottom-0 z-10 bg-background pb-4 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-8 before:bg-linear-to-t before:from-background'
        )}
      >
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={`${id}-message`} className="sr-only">
            {t('lookups.ai.message')}
          </FieldLabel>
          <InputGroup className="rounded-2xl bg-card shadow-sm has-[[data-slot=input-group-control]:focus-visible]:ring-ring/15 dark:bg-card">
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
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              autoFocus
              enterKeyHint="send"
              placeholder={t(
                started ? 'lookups.ai.reply-placeholder' : 'lookups.ai.message-placeholder'
              )}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
              className="max-h-52 min-h-12 px-3.5 pt-3 text-base md:text-base"
              onChange={({ currentTarget }) => {
                setText(currentTarget.value)
                setBlank(false)
              }}
              onKeyDown={sendOnEnter}
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                size="icon-sm"
                className="rounded-full"
                aria-label={t('lookups.ai.attach')}
                onClick={() => fileInput.current?.click()}
              >
                <PaperclipIcon />
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
                size="icon-sm"
                className="ml-auto rounded-full"
                aria-label={t('lookups.ai.send')}
                aria-disabled={sending}
              >
                {sending ? <Spinner /> : <ArrowUpIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription id={`${id}-hint`} className="text-center text-xs">
            {t('lookups.ai.message-hint')}
          </FieldDescription>
          {refused > 0 && (
            <FieldDescription className="text-center text-xs">
              {t('lookups.ai.refused', { count: refused })}
            </FieldDescription>
          )}
          {error && (
            <FieldError id={`${id}-error`} className="text-center">
              {t(...error)}
            </FieldError>
          )}
        </Field>
      </form>
      {!started && (
        <div
          role="group"
          aria-labelledby={`${id}-examples`}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span id={`${id}-examples`} className="text-sm text-muted-foreground">
            {t('lookups.ai.examples-label')}
          </span>
          {EXAMPLES.map((example) => (
            <Button
              key={example}
              variant="outline"
              size="sm"
              className="rounded-full font-normal"
              onClick={() => pickExample(t(`lookups.ai.examples.${example}`))}
            >
              {t(`lookups.ai.examples.${example}`)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
