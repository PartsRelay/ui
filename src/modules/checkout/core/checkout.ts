import { z } from 'zod'
import type {
  CheckoutObject,
  OrderItem,
  PostApiV1CheckoutsTokenConfirmBodyItemsItem,
} from '@/core/api/models'
import { errorCode } from '@/core/errors'

export const MAX_QUANTITY = 99

export const checkoutSearchSchema = z.object({ token: z.string().catch('') })

export type Article = Omit<OrderItem, 'quantity'> & { index: number }

export type PartView = { key: string; position: string | null; articles: Article[] }

export type GroupView = { key: string; name: string | null; parts: PartView[] }

export type CheckoutView = { groups: GroupView[]; articles: Article[] }

export function checkoutView({ categories }: Pick<CheckoutObject, 'categories'>): CheckoutView {
  const articles: Article[] = []
  const listed = (article: Omit<Article, 'index'>) => {
    const item = { ...article, index: articles.length }
    articles.push(item)

    return item
  }
  const groups = categories.flatMap((category) =>
    category.units.flatMap((unit, at) => {
      const key = `${category.id}:${at}`
      const parts = unit.original.map((part, index) => ({
        key: `${key}:${index}`,
        position: part.position,
        articles: [
          listed({ original: true, code: part.code, brand: null, description: part.name }),
          ...part.aftermarket.map(({ code, brand, description }) =>
            listed({ original: false, code, brand, description })
          ),
        ],
      }))

      return parts.length > 0 ? [{ key, name: unit.name ?? category.name, parts }] : []
    })
  )

  return { groups, articles }
}

export function orderItems(
  articles: Article[],
  quantities: number[]
): PostApiV1CheckoutsTokenConfirmBodyItemsItem[] {
  return articles.flatMap(({ index, code, brand }) =>
    quantities[index]! > 0 ? [{ code, brand, quantity: quantities[index]! }] : []
  )
}

export function pieces(quantities: number[]) {
  return quantities.reduce((total, quantity) => total + quantity, 0)
}

export function articleCode({ brand, code }: Pick<OrderItem, 'brand' | 'code'>) {
  return [brand, code].filter(Boolean).join(' ')
}

export function unavailable(error: unknown) {
  return errorCode(error) === 'checkout-not-found'
}

export function insideWhatsapp(userAgent: string) {
  return /whatsapp/i.test(userAgent)
}
