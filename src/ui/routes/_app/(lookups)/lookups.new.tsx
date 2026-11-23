import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { newLookupSchema } from '@/modules/lookups/core/lookups'
import { NewLookupPage } from '@/modules/lookups/ui/new-lookup-page'

export const Route = createFileRoute('/_app/(lookups)/lookups/new')({
  validateSearch: newLookupSchema,
  staticData: { crumb: 'new-lookup' },
  head: pageHead('lookups.ai.head'),
  component: NewLookupPage,
})
