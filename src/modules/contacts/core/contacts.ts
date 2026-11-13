import { z } from 'zod'
import { ContactObjectStatus } from '@/core/api/models'

export const contactTabs = ['all', ...Object.values(ContactObjectStatus)] as const

export type ContactTab = (typeof contactTabs)[number]

export const contactsSearchSchema = z.object({
  status: z.enum(ContactObjectStatus).optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  page: z.number().int().min(1).default(1).catch(1),
})

export type ContactsSearch = z.infer<typeof contactsSearchSchema>

export function tabStatus(tab: string) {
  return contactsSearchSchema.shape.status.parse(tab)
}
