import { subDays, subMinutes } from 'date-fns'
import {
  getGetApiV1LookupsLookupIdMockHandler,
  getPostApiV1LookupsMessageMockHandler,
} from '@/core/api/endpoints/lookups/lookups.msw'
import {
  getGetApiV1WorkspaceLookupsMockHandler,
  getGetApiV1WorkspaceLookupsStatsMockHandler,
} from '@/core/api/endpoints/workspace-lookups/workspace-lookups.msw'
import {
  type CheckoutObjectStatus,
  type LookupObject,
  LookupObjectSource,
  LookupObjectStatus,
  type OrderItem,
  type Searcher,
  SearcherType,
  type TopSearcher,
} from '@/core/api/models'
import { member, signedInMember } from '@/mocks/auth'
import { checkedPage, page, people, type Person } from '@/mocks/data'
import { fail, invalid, rejected } from '@/mocks/errors'
import explodedView from '@/mocks/exploded-view.svg?no-inline'
import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from '@/core/pagination'

type Text = [en: string, it: string]

type Language = 0 | 1

type Match = [brand: string, code: string, description: string]

type Unit = {
  code: string
  name: Text
  image: boolean
  original: { code: string; name: Text; position: string | null; aftermarket: Match[] }[]
}

type Category = { name: Text; words: string[]; units: Unit[] }

type Stored = Omit<LookupObject, 'searcher' | 'vehicleDescription' | 'categories' | 'orderUrl'> & {
  company: string
  searcher: Searcher
  gone?: boolean
  cached: boolean
  // The order it is in, none for the searches made before the orders
  orderId?: number
}

export type StoredOrder = {
  id: number
  company: string
  userId: number
  status: CheckoutObjectStatus
  items: OrderItem[]
}

type Archive = { lookups: Stored[]; nextId: number; orders: StoredOrder[] }

const VIN = /^[A-HJ-NPR-Z0-9]{17}$/
const STALE_MINUTES = 15
const STATS_DAYS = 30
const TOP_SEARCHERS = 5
const FAILED: LookupObjectStatus[] = ['failed', 'vehicle_not_found', 'not_matched']
const FAILING_PLATE = 'ER500ER'

// For this plate the reader is busy once per load
const BUSY_PLATE = /\bER\s?503\s?ER\b/i

let readerBusy = true

const VEHICLES: Record<string, { vin: string; description: string }> = {
  AB123CD: { vin: 'ZFA31200003456789', description: 'Fiat Panda 1.2' },
  GH482KL: { vin: 'ZFA31200007712345', description: 'Fiat Panda 1.2 8V' },
  FT915ZR: { vin: 'WVWZZZAUZHW204411', description: 'Volkswagen Golf VII 2.0 TDI' },
  DK318MP: { vin: 'VF1RFB00X56123456', description: 'Renault Clio IV 1.5 dCi' },
  GX345LM: { vin: 'ZAR94000007654321', description: 'Alfa Romeo Giulietta 1.6 JTDm' },
  GH859KJ: { vin: 'VF3CCHMZ6FT012345', description: 'Peugeot 208 1.2 PureTech' },
}

const CATALOG: Record<string, Category> = {
  g1: {
    name: ['Oil filter', 'Filtro olio'],
    words: ['oil', 'olio'],
    units: [
      {
        code: '10106',
        name: ['Oil filter and supports', 'Filtro olio e supporti'],
        image: true,
        original: [
          {
            code: '55256470',
            name: ['Oil filter', 'Filtro olio'],
            position: '3',
            aftermarket: [
              ['MANN-FILTER', 'W 712/95', 'Oil filter'],
              ['BOSCH', 'F 026 407 209', 'Oil filter'],
              ['UFI', '23.123.00', 'Oil filter'],
            ],
          },
        ],
      },
    ],
  },
  g2: {
    name: ['Air filter', 'Filtro aria'],
    words: ['air', 'aria'],
    units: [
      {
        code: '10420',
        name: ['Air cleaner', 'Depuratore aria'],
        image: true,
        original: [
          {
            code: '51854724',
            name: ['Air filter', 'Filtro aria'],
            position: '3',
            aftermarket: [
              ['MANN-FILTER', 'C 2433/2', 'Air filter'],
              ['MAHLE', 'LX 2826', 'Air filter'],
            ],
          },
        ],
      },
    ],
  },
  g3: {
    name: ['Cabin filter', 'Filtro abitacolo'],
    words: ['cabin', 'pollen', 'abitacolo', 'polline'],
    units: [],
  },
  g4: {
    name: ['Front brake pads', 'Pastiglie freno anteriori'],
    words: ['brake', 'pad', 'freno', 'freni', 'pastiglie'],
    units: [
      {
        code: '50110',
        name: ['Front brakes', 'Freni anteriori'],
        image: true,
        original: [
          {
            code: '77367141',
            name: ['Front brake pad set', 'Kit pastiglie freno anteriori'],
            position: '4',
            aftermarket: [
              ['BREMBO', 'P 23 141', 'Brake pad set, disc brake'],
              ['TRW', 'GDB1891', 'Brake pad set, disc brake'],
              ['BOSCH', '0 986 494 597', 'Brake pad set, disc brake'],
            ],
          },
        ],
      },
      {
        code: '50112',
        name: ['Front brake caliper', 'Pinza freno anteriore'],
        image: true,
        original: [
          {
            code: '77365620',
            name: ['Brake pad fitting kit', 'Kit accessori pastiglie'],
            position: '6',
            aftermarket: [['TRW', 'PFK543', 'Accessory kit, disc brake pads']],
          },
          {
            code: '46402682',
            name: ['Pad retaining spring', 'Molla fermo pastiglie'],
            position: '7',
            aftermarket: [],
          },
        ],
      },
    ],
  },
  g5: {
    name: ['Clutch kit', 'Kit frizione'],
    words: ['clutch', 'frizione'],
    units: [
      {
        code: '18010',
        name: ['Clutch', 'Frizione'],
        image: false,
        original: [
          {
            code: '55238862',
            name: ['Clutch kit', 'Kit frizione'],
            position: null,
            aftermarket: [],
          },
        ],
      },
    ],
  },
  g6: {
    name: ['Timing belt kit', 'Kit distribuzione'],
    words: ['timing', 'belt', 'distribuzione', 'cinghia'],
    units: [
      {
        code: '10132',
        name: ['Timing drive', 'Comando distribuzione'],
        image: true,
        original: [
          {
            code: '71771580',
            name: ['Timing belt kit', 'Kit cinghia distribuzione'],
            position: '1',
            aftermarket: [
              ['GATES', 'K015607XS', 'Timing belt kit'],
              ['CONTITECH', 'CT1028K1', 'Timing belt kit'],
            ],
          },
        ],
      },
    ],
  },
}

function imageOf(size: string) {
  const url = new URL(explodedView, window.location.origin)
  url.searchParams.set('size', size)

  return url.href
}

const user = (person: Person): Searcher => ({
  type: 'user',
  id: Number(person.id),
  name: person.name || person.email,
})

const contact = (id: number, name: string): Searcher => ({ type: 'contact', id, name })

const workshops = {
  oakfield: contact(1, 'Oakfield Garage'),
  baker: contact(2, 'Baker and Sons Motors'),
  hillside: contact(3, 'Hillside Auto Repair'),
  capitol: contact(6, 'Capitol Auto Care'),
  quickFit: contact(5, 'Quick Fit Tyres'),
}

const NUMBER_COUNTRIES: Record<number, string> = { 6: 'US' }

// Like the core: a contact searches in its number country
const countryOf = (searcher: Searcher, company: string) =>
  (searcher.type === 'contact' && NUMBER_COUNTRIES[searcher.id]) || company

const identified: LookupObjectStatus[] = ['done', 'not_matched']

type Seed = [
  identifier: string,
  status: LookupObjectStatus,
  searcher: Searcher,
  nodeIds: string[],
  query: string,
  options?: { gone?: boolean; cached?: boolean },
]

const RECENT: Seed[] = [
  ['GH482KL', 'running', user(people.julia), [], 'Front brake pads'],
  ['FT915ZR', 'done', workshops.oakfield, ['g1'], 'Oil filter'],
  ['EX204BB', 'vehicle_not_found', user(people.mark), [], 'Clutch kit'],
  ['AB123CD', 'done', user(people.mark), ['g4'], 'Front brake pads'],
  ['DK318MP', 'not_matched', workshops.baker, [], 'Wiper blades'],
  ['GH482KL', 'failed', user(people.luke), [], 'Timing belt kit'],
  ['AB123CD', 'done', workshops.hillside, ['g1', 'g2'], 'Oil and air filters'],
  ['FT915ZR', 'done', workshops.quickFit, ['g6'], 'Timing belt kit', { gone: true }],
  ['DK318MP', 'done', workshops.capitol, ['g5'], 'Clutch kit', { cached: false }],
]

const OLDER: Seed[] = [
  ['AB123CD', 'done', workshops.oakfield, ['g2'], 'Air filter'],
  ['WVWZZZAUZHW204411', 'done', user(people.sarah), ['g4'], 'Front brake pads'],
  ['ZZ999ZZ', 'vehicle_not_found', workshops.baker, [], 'Oil filter'],
  ['GH482KL', 'done', user(people.julia), ['g6'], 'Timing belt kit'],
  ['DK318MP', 'done', workshops.oakfield, ['g1'], 'Oil filter'],
]

// The VIN first, like the core
const vehicleOf = ({ plate, vin }: Pick<LookupObject, 'plate' | 'vin'>) =>
  (vin && Object.values(VEHICLES).find((vehicle) => vehicle.vin === vin)) ||
  (plate ? VEHICLES[plate] : undefined)

function seed(): Stored[] {
  const now = new Date()
  const { country } = member()
  const seeds = [...RECENT, ...OLDER, ...OLDER, ...OLDER].reverse()

  return seeds.map(([identifier, status, searcher, nodeIds, query, options], index) => {
    const minutes = (seeds.length - index - 1) ** 2 * 136 + 1
    const plate = VIN.test(identifier) ? null : identifier
    const vin =
      plate === null ? identifier : identified.includes(status) ? VEHICLES[plate]!.vin : null

    return {
      id: index + 1,
      company: 'redwood-parts',
      plate,
      vin,
      query,
      country: countryOf(searcher, country),
      nodeIds,
      status,
      source: searcher.type === 'contact' ? 'whatsapp' : 'web',
      searcher,
      createdAt: subMinutes(now, minutes).toISOString(),
      cached: options?.cached ?? true,
      gone: options?.gone,
    }
  })
}

export function archive<T>(change: (state: Archive) => T): T {
  const saved = sessionStorage.getItem('mock.lookups')
  const state: Archive = {
    orders: [],
    ...(saved ? JSON.parse(saved) : { lookups: seed(), nextId: 100 }),
  }
  const result = change(state)
  sessionStorage.setItem('mock.lookups', JSON.stringify(state))

  return result
}

export const languageOf = (request: Request): Language =>
  request.headers.get('accept-language')?.startsWith('it') ? 1 : 0

export function categoriesOf(nodeIds: string[], language: Language) {
  return nodeIds.map((id) => {
    const { name, units } = CATALOG[id]!

    return {
      id,
      name: name[language],
      units: units.map((unit) => ({
        code: unit.code,
        name: unit.name[language],
        imageUrl: unit.image ? imageOf('source') : null,
        thumbnailUrl: unit.image ? imageOf('250') : null,
        original: unit.original.map((part) => ({
          code: part.code,
          name: part.name[language],
          position: part.position,
          aftermarket: part.aftermarket.map(([brand, code, description]) => ({
            brand,
            code,
            description,
          })),
        })),
      })),
    }
  })
}

const stale = ({ status, createdAt }: Stored) =>
  status === 'running' && new Date(createdAt) < subMinutes(new Date(), STALE_MINUTES)

const statusOf = (stored: Stored) => (stale(stored) ? 'failed' : stored.status)

export const ORDER_TOKEN = 'order-'

// Like the core: the link of the open order, for who searched
function orderUrlOf({ orderId, searcher, status }: Stored, orders: StoredOrder[], lang: Language) {
  const mine = searcher.type === 'user' && searcher.id === Number(signedInMember()?.user.id)
  const open = orders.some((order) => order.id === orderId && order.status === 'open')

  return mine && open && status === 'done'
    ? `${location.origin}/checkout?token=${ORDER_TOKEN}${orderId}&lng=${lang ? 'it-IT' : 'en-US'}`
    : null
}

export function lookupOf(
  stored: Stored,
  language: Language,
  orders: StoredOrder[] = []
): LookupObject {
  const { company: _company, gone, cached, searcher, orderId: _orderId, ...lookup } = stored
  const status = statusOf(stored)
  const details = cached && identified.includes(status)

  return {
    ...lookup,
    status,
    searcher: gone ? null : searcher,
    ...(details && { vehicleDescription: vehicleOf(lookup)?.description ?? null }),
    ...(details && status === 'done' && { categories: categoriesOf(lookup.nodeIds, language) }),
    orderUrl: orderUrlOf(stored, orders, language),
  }
}

function checkedSearcherId(query: URLSearchParams) {
  if (!query.has('searcherId')) return null

  const value = Number(query.get('searcherId'))
  if (Number.isNaN(value)) rejected('searcherId', 'number')
  if (value <= 0) rejected('searcherId', 'positive')

  return value
}

function matching(query: string) {
  const text = query.toLowerCase()

  return Object.entries(CATALOG)
    .filter(([, { words }]) => words.some((word) => text.includes(word)))
    .map(([id]) => id)
}

const VIN_IN_TEXT = /\b[A-HJ-NPR-Z0-9]{17}\b/i
const PLATE_IN_TEXT = /\b[A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}\b/i
const CONNECTORS = /^(?:\W|for|per|the|la|il)+|(?:\W|for|per|of|di|del|della)+$/gi

// Parts the assistant asks about before it searches
const UNCLEAR = /^(?:(?:brake )?pads|pastiglie(?: freno)?)$/i
const YES = /^\s*(?:yes|ok|s[iì])\b/i
const NO = /^\s*no\b/i
const RESET = /\b(?:empty|reset|start over|azzera|svuota|ricomincia)\b/i

type Wanted = Pick<Stored, 'plate' | 'vin'> & { query: string }

// What a chat said so far: kept while the page lives, like the memory of the core
type Talk = {
  plate: string | null
  vin: string | null
  parts: string | null
  // The search this chat last started or changed
  last: number | null
  // The search waiting for the answer about the open order
  pending: Wanted | null
}

const NO_TALK: Talk = { plate: null, vin: null, parts: null, last: null, pending: null }

const talks = new Map<string, Talk>()

const said = (language: Language, en: string, it: string) => (language ? it : en)

const REPLIES = {
  both: (l: Language) =>
    said(
      l,
      'Tell me the plate or the VIN and the parts you need, or attach a photo of the registration document.',
      'Dimmi la targa o il telaio e i ricambi che ti servono, oppure allega una foto del libretto.'
    ),
  vehicle: (l: Language) =>
    said(
      l,
      'Which vehicle is it for? Write the plate or the VIN, or attach a photo.',
      'Per quale veicolo? Scrivi la targa o il telaio, oppure allega una foto.'
    ),
  parts: (l: Language, vehicle: string) =>
    said(l, `Which parts do you need for ${vehicle}?`, `Quali ricambi ti servono per ${vehicle}?`),
  pads: (l: Language) => said(l, 'Front or rear brake pads?', 'Pastiglie anteriori o posteriori?'),
  started: (l: Language, vehicle: string, parts: string) =>
    said(
      l,
      `Search started for ${vehicle}: ${parts}.`,
      `Ricerca partita per ${vehicle}: ${parts}.`
    ),
  changed: (l: Language, vehicle: string, parts: string) =>
    said(
      l,
      `Ok, I change the search for ${vehicle}: ${parts}.`,
      `Ok, modifico la ricerca per ${vehicle}: ${parts}.`
    ),
  cancel: (l: Language, vehicle: string) =>
    said(
      l,
      `Do you want to cancel the previous order for ${vehicle}?`,
      `Vuoi annullare l'ordine precedente per ${vehicle}?`
    ),
  cancelled: (l: Language, vehicle: string, parts: string) =>
    said(
      l,
      `Ok, order cancelled. Search started for ${vehicle}: ${parts}.`,
      `Ok, ordine annullato. Ricerca partita per ${vehicle}: ${parts}.`
    ),
  reset: (l: Language) =>
    said(
      l,
      'Ok, I emptied the order. Tell me the vehicle and the parts to start again.',
      "Ok, ho azzerato l'ordine. Dimmi il veicolo e i ricambi per ricominciare."
    ),
  noOrder: (l: Language) => said(l, 'There is no open order.', "Non c'è nessun ordine aperto."),
}

const labelOf = ({ plate, vin }: Pick<Stored, 'plate' | 'vin'>) => plate ?? vin ?? ''

const sameVehicle = (a: Pick<Stored, 'plate' | 'vin'>, b: Pick<Stored, 'plate' | 'vin'>) =>
  (a.vin !== null && a.vin === (b.vin ?? vehicleOf(b)?.vin)) ||
  (a.plate !== null && a.plate === b.plate)

// The open order of a member, with its searches still running or done
function openOrder(state: Archive, company: string, userId: number) {
  const order = state.orders.find(
    (item) => item.company === company && item.userId === userId && item.status === 'open'
  )
  const searches = state.lookups.filter(
    (lookup) => order && lookup.orderId === order.id && ['running', 'done'].includes(lookup.status)
  )

  return { order, searches }
}

// Like the model: the photos are read from their file names
function readMessage(text: string, images: File[]) {
  const photos = images.map(({ name }) => name.replace(/\.\w+$/, '').replace(/[_-]+/g, ' '))
  const all = [text, ...photos].join(' ')
  const vin = all.match(VIN_IN_TEXT)?.[0].toUpperCase() ?? null
  const plate = all.match(PLATE_IN_TEXT)?.[0].replace(/[\s-]/g, '').toUpperCase() ?? null
  const rest = text.replace(VIN_IN_TEXT, ' ').replace(PLATE_IN_TEXT, ' ').replace(/\s+/g, ' ')
  const parts = matching(rest).length > 0 ? rest.replace(CONNECTORS, '').trim() : null

  return { vin, plate, parts }
}

function settled(lookup: Stored): Stored {
  const vehicle = vehicleOf(lookup)
  if (lookup.plate === FAILING_PLATE) return { ...lookup, status: 'failed' }
  if (!vehicle) return { ...lookup, status: 'vehicle_not_found' }

  const nodeIds = matching(lookup.query ?? '')
  const status = nodeIds.length === 0 ? 'not_matched' : 'done'

  return { ...lookup, vin: vehicle.vin, nodeIds, status }
}

function checkedEnum<T extends string>(query: URLSearchParams, name: string, values: T[]) {
  const value = query.get(name)
  if (value === null) return null

  return values.find((item) => item === value) ?? rejected(name, 'enum')
}

function contains(values: (string | null)[], search: string | null) {
  return !search || values.some((value) => value?.toLowerCase().includes(search.toLowerCase()))
}

function topSearchers(lookups: Stored[]) {
  const counts = new Map<string, TopSearcher>()

  for (const { searcher, gone } of lookups) {
    const key = `${searcher.type}:${searcher.id}`
    const top = counts.get(key) ?? { searcher: gone ? null : searcher, total: 0 }
    counts.set(key, { ...top, total: top.total + 1 })
  }

  return [...counts.values()].sort((a, b) => b.total - a.total).slice(0, TOP_SEARCHERS)
}

const isSearcherType = (value: string): value is SearcherType =>
  Object.values<string>(SearcherType).includes(value)

export const lookupMocks = [
  getGetApiV1WorkspaceLookupsMockHandler(async ({ request }) => {
    const { company } = member()
    const query = new URL(request.url).searchParams
    const currentPage = checkedPage(query, 'page', 1)
    const perPage = checkedPage(query, 'perPage', DEFAULT_PER_PAGE, MAX_PER_PAGE)
    const searcherType = query.get('searcherType')
    if (searcherType !== null && !isSearcherType(searcherType)) rejected('searcherType', 'enum')
    if (searcherType === null && query.has('searcherId')) rejected('searcherType', 'required')
    const searcherId = checkedSearcherId(query)
    const search = query.get('search')?.trim() || null
    const status = checkedEnum(query, 'status', Object.values(LookupObjectStatus))
    const source = checkedEnum(query, 'source', Object.values(LookupObjectSource))
    const since = query.has('days') ? subDays(new Date(), checkedPage(query, 'days', 1)) : null

    return archive((state) => {
      const lookups = state.lookups
        .filter((item) => item.company === company)
        .filter(({ searcher }) => searcherType === null || searcher.type === searcherType)
        .filter(({ searcher }) => searcherId === null || searcher.id === searcherId)
        .sort((a, b) => b.id - a.id)
        .map((item) => lookupOf(item, languageOf(request)))
        .filter((item) => contains([item.plate, item.vin], search))
        .filter((item) => status === null || item.status === status)
        .filter((item) => source === null || item.source === source)
        .filter((item) => since === null || new Date(item.createdAt) >= since)

      return page(lookups, currentPage, perPage)
    })
  }),
  getGetApiV1LookupsLookupIdMockHandler(async ({ request, params }) => {
    const { company } = member()

    return archive((state) => {
      const found = state.lookups.find(
        (item) => item.company === company && item.id === Number(params.lookupId)
      )

      return {
        data: lookupOf(
          found ?? fail(404, 'row-not-found', 'Row not found'),
          languageOf(request),
          state.orders
        ),
      }
    })
  }),
  getPostApiV1LookupsMessageMockHandler(async ({ request }) => {
    const { company, country, user: me } = member()
    const language = languageOf(request)
    const form = await request.formData()
    const text = String(form.get('message') ?? '').trim()
    const conversation = String(form.get('conversation') ?? '') || null
    const images = form.getAll('images').filter((value): value is File => value instanceof File)
    if (!text && images.length === 0) invalid([{ field: 'message', rule: 'requiredIfMissing' }])
    if (images.length > 4) invalid([{ field: 'images', rule: 'array.maxLength' }])
    if (readerBusy && BUSY_PLATE.test(text)) {
      readerBusy = false
      fail(503, 'service-unavailable', 'Service unavailable')
    }

    const talk = (conversation && talks.get(conversation)) || NO_TALK
    const remember = (next: Talk) => void (conversation && talks.set(conversation, next))

    return archive((state) => {
      const userId = Number(me.id)
      const { order, searches } = openOrder(state, company, userId)
      const answer = (reply: string, read: Partial<Wanted> = {}, lookup: Stored | null = null) => ({
        data: {
          vin: lookup?.vin ?? read.vin ?? null,
          plate: lookup?.plate ?? read.plate ?? null,
          parts: lookup?.query ?? read.query ?? null,
          missing: lookup
            ? []
            : [...(read.vin || read.plate ? [] : ['vehicle']), ...(read.query ? [] : ['parts'])],
          reply,
          lookup: lookup && lookupOf({ ...lookup, status: 'running' }, language, state.orders),
        },
      })
      // A new search of the member, in its open order
      const start = (wanted: Wanted, orderId: number) => {
        const running: Stored = {
          id: state.nextId++,
          company,
          ...wanted,
          country,
          nodeIds: [],
          status: 'running',
          source: 'web',
          searcher: user(me),
          createdAt: new Date().toISOString(),
          cached: true,
          orderId,
        }
        state.lookups.push(settled(running))
        remember({ ...NO_TALK, plate: wanted.plate, vin: wanted.vin, last: running.id })

        return running
      }
      const opened = () => {
        const id = Math.max(0, ...state.orders.map((item) => item.id)) + 1
        state.orders.push({ id, company, userId, status: 'open', items: [] })

        return id
      }
      const joined = () => order?.id ?? opened()

      if (RESET.test(text)) {
        if (order) order.status = 'cancelled'
        remember(NO_TALK)

        return answer(order ? REPLIES.reset(language) : REPLIES.noOrder(language))
      }

      // The answer to the question about the open order
      if (talk.pending && (YES.test(text) || NO.test(text))) {
        const cancelled = YES.test(text)
        if (order && cancelled) order.status = 'cancelled'

        const wanted = talk.pending
        const lookup = start(wanted, cancelled ? opened() : joined())

        return answer(
          REPLIES[cancelled ? 'cancelled' : 'started'](language, labelOf(wanted), wanted.query),
          wanted,
          lookup
        )
      }

      const read = readMessage(text, images)
      const named = read.vin !== null || read.plate !== null
      const vehicle = named
        ? { plate: read.plate, vin: read.vin }
        : { plate: talk.plate, vin: talk.vin }
      // An answer with no part in it completes the parts asked about
      const parts =
        read.parts ?? (talk.parts && text && !named ? `${talk.parts} ${text}`.trim() : talk.parts)
      const known = vehicle.vin !== null || vehicle.plate !== null
      const last = searches.find(({ id }) => id === talk.last)

      // More parts for the search of this chat: the same search, changed
      if (!named && read.parts && last) {
        last.query = `${last.query}, ${read.parts}`
        Object.assign(last, settled({ ...last, status: 'running' }))

        return answer(REPLIES.changed(language, labelOf(last), last.query), {}, last)
      }

      if (!known || !parts) {
        remember({ ...talk, ...vehicle, parts })

        return answer(
          !known && !parts
            ? REPLIES.both(language)
            : known
              ? REPLIES.parts(language, labelOf(vehicle))
              : REPLIES.vehicle(language),
          { ...vehicle, query: parts ?? undefined }
        )
      }

      if (UNCLEAR.test(parts)) {
        remember({ ...talk, ...vehicle, parts })

        return answer(REPLIES.pads(language), { ...vehicle, query: parts })
      }

      const wanted = { ...vehicle, query: parts }
      const same = searches.find((search) => sameVehicle(search, wanted))

      // The vehicle is already in the order: its search takes the new parts
      if (same) {
        same.query = parts
        Object.assign(same, settled({ ...same, status: 'running' }))
        remember({ ...NO_TALK, ...vehicle, last: same.id })

        return answer(REPLIES.changed(language, labelOf(same), parts), wanted, same)
      }

      const others = [...new Set(searches.map(labelOf))]

      // Another vehicle, with one in the order: the member decides what becomes of it
      if (conversation && others.length === 1) {
        remember({ ...NO_TALK, pending: wanted })

        return answer(REPLIES.cancel(language, others[0]!), wanted)
      }

      return answer(
        REPLIES.started(language, labelOf(wanted), parts),
        wanted,
        start(wanted, joined())
      )
    })
  }),
  getGetApiV1WorkspaceLookupsStatsMockHandler(async ({ request }) => {
    const { company, role } = member()
    if (role !== 'owner') fail(403, 'authorization-failure', 'Access denied')
    const days = checkedPage(new URL(request.url).searchParams, 'days', STATS_DAYS)
    const since = subDays(new Date(), days)
    const before = subDays(since, days)

    return archive((state) => {
      const lookups = state.lookups.filter((item) => item.company === company)
      const after = (date: Date) => lookups.filter((item) => new Date(item.createdAt) >= date)
      const current = after(since)
      const count = (statuses: LookupObjectStatus[]) =>
        current.filter((item) => statuses.includes(statusOf(item))).length

      return {
        data: {
          days,
          total: current.length,
          done: count(['done']),
          failed: count(FAILED),
          previousTotal: after(before).length - current.length,
          topSearchers: topSearchers(current),
        },
      }
    })
  }),
]
