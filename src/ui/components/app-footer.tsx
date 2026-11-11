import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { legalLinks } from '@/core/legal'
import { AppVersion } from '@/ui/components/app-version'
import { ExternalLink } from '@/ui/components/external-link'

export function AppFooter({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const links = legalLinks()

  return (
    <footer className="flex flex-wrap justify-center gap-x-2 p-4 text-sm text-muted-foreground">
      {links.map(({ id, url }) => (
        <Fragment key={id}>
          <ExternalLink href={url}>{t(`app.legal.${id}`)}</ExternalLink>
          <span aria-hidden>·</span>
        </Fragment>
      ))}
      {children}
      <AppVersion />
    </footer>
  )
}
