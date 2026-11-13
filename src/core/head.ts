import { env } from '@/env'
import { i18n } from '@/i18n'

export function appHead() {
  const url = `${env.UI_URL || window.location.origin}${window.location.pathname}`

  return {
    meta: [
      { title: env.APP_NAME },
      { name: 'robots', content: 'noindex' },
      { property: 'og:url', content: url },
      { name: 'twitter:url', content: url },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

export function pageHead(key: string, indexed = false) {
  return () => ({
    meta: [
      { title: i18n.t('app.title', { page: i18n.t(key) }) },
      ...(indexed ? [{ name: 'robots', content: 'index, follow' }] : []),
    ],
  })
}
