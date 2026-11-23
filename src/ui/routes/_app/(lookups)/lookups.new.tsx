import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { newSearchSchema } from '@/modules/lookups/core/lookups'
import { NewSearchPage } from '@/modules/lookups/ui/new-search-page'

export const Route = createFileRoute('/_app/(lookups)/lookups/new')({
  validateSearch: newSearchSchema,
  staticData: { crumb: 'new-search' },
  head: pageHead('lookups.ai.head'),
  component: NewSearchPage,
})
