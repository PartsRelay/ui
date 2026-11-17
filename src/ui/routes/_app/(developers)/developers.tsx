import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { DevelopersPage } from '@/modules/developers/ui/developers-page'

export const Route = createFileRoute('/_app/(developers)/developers')({
  staticData: { crumb: 'developers' },
  head: pageHead('developers.title'),
  component: DevelopersPage,
})
