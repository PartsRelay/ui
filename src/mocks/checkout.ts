import {
  getGetApiV1CheckoutsTokenMockHandler,
  getPostApiV1CheckoutsTokenCancelMockHandler,
  getPostApiV1CheckoutsTokenConfirmMockHandler,
} from '@/core/api/endpoints/checkouts/checkouts.msw'
import type {
  CheckoutObject,
  OrderItem,
  PostApiV1CheckoutsTokenConfirmBody,
} from '@/core/api/models'
import { apiBody, fail, rejected } from '@/mocks/errors'
import { categoriesOf, languageOf } from '@/mocks/lookups'

type Decision = Pick<CheckoutObject, 'status' | 'items'>

const EXPIRED = 'expired'
const MAX_ITEMS = 50
const MAX_QUANTITY = 99

function decisions<T>(change: (state: Record<string, Decision>) => T): T {
  const state = JSON.parse(sessionStorage.getItem('mock.checkouts') ?? '{}')
  const result = change(state)
  sessionStorage.setItem('mock.checkouts', JSON.stringify(state))

  return result
}

function checkoutOf(token: string, request: Request): CheckoutObject {
  if (token === EXPIRED) {
    fail(404, 'checkout-not-found', 'The checkout link is not valid or has expired')
  }

  const decision: Decision | undefined = decisions((state) => state[token])

  return {
    status: decision?.status ?? 'open',
    company: 'Redwood Parts Ltd',
    plate: 'AB123CD',
    vin: 'ZFA31200003456789',
    query: 'front brake pads',
    vehicleDescription: 'Fiat Panda 1.2',
    chatUrl: 'https://wa.me/390287341190',
    categories: decision ? [] : categoriesOf(['g4'], languageOf(request)),
    items: decision?.items ?? [],
  }
}

function decide(token: string, request: Request, decision: (open: CheckoutObject) => Decision) {
  const open = checkoutOf(token, request)

  if (open.status !== 'open') {
    fail(409, 'checkout-closed', 'The order was already confirmed or cancelled')
  }

  const decided = decision(open)
  decisions((state) => void (state[token] = decided))

  return { data: { ...open, categories: [], ...decided } }
}

function offers({ categories }: CheckoutObject): Omit<OrderItem, 'quantity'>[] {
  return categories
    .flatMap((category) => category.units)
    .flatMap((unit) => unit.original)
    .flatMap((part) => [
      { original: true, code: part.code, brand: null, description: part.name },
      ...part.aftermarket.map((match) => ({ original: false, ...match })),
    ])
}

function ordered(open: CheckoutObject, picks: unknown): OrderItem[] {
  const items: PostApiV1CheckoutsTokenConfirmBody['items'] = Array.isArray(picks) ? picks : []

  if (items.length === 0) return rejected('items', 'array.minLength')
  if (items.length > MAX_ITEMS) return rejected('items', 'array.maxLength')

  return items.map(({ code, brand = null, quantity }, index) => {
    const offer = offers(open).find((item) => item.code === code && item.brand === brand)

    if (!Number.isInteger(quantity) || quantity < 1)
      return rejected(`items.${index}.quantity`, 'min')
    if (quantity > MAX_QUANTITY) return rejected(`items.${index}.quantity`, 'max')
    if (!offer) return rejected(`items.${index}.code`, 'offered')

    return { ...offer, quantity }
  })
}

export const checkoutMocks = [
  getGetApiV1CheckoutsTokenMockHandler(({ params, request }) => ({
    data: checkoutOf(String(params.token), request),
  })),
  getPostApiV1CheckoutsTokenConfirmMockHandler(async ({ params, request }) => {
    const { items } = await apiBody<PostApiV1CheckoutsTokenConfirmBody>(request)

    return decide(String(params.token), request, (open) => ({
      status: 'confirmed',
      items: ordered(open, items),
    }))
  }),
  getPostApiV1CheckoutsTokenCancelMockHandler(({ params, request }) =>
    decide(String(params.token), request, () => ({ status: 'cancelled', items: [] }))
  ),
]
