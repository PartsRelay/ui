import { describe, expect, it, vi } from 'vite-plus/test'
import { appHead, pageHead } from '@/core/head'

const env = vi.hoisted(() => ({ APP_NAME: 'Parts Relay', UI_URL: '' }))

vi.mock('@/env', () => ({ env }))

function visit(href: string) {
  vi.stubGlobal('window', { location: new URL(href) })
}

describe('head', () => {
  it('names the address of the page without its search and keeps it out of search engines', () => {
    visit('https://app.example.com/lookups?status=done#top')

    const { meta, links } = appHead()
    const address = 'https://app.example.com/lookups'

    expect(links).toEqual([{ rel: 'canonical', href: address }])
    expect(meta).toContainEqual({ property: 'og:url', content: address })
    expect(meta).toContainEqual({ name: 'twitter:url', content: address })
    expect(meta).toContainEqual({ name: 'robots', content: 'noindex' })
  })

  it('names the public address of the app when it has one', () => {
    env.UI_URL = 'https://app.example.com'
    visit('https://preview.example.com/login?next=/')

    const { links } = appHead()
    env.UI_URL = ''

    expect(links).toEqual([{ rel: 'canonical', href: 'https://app.example.com/login' }])
  })

  it('titles a page and opens only an indexed one to search engines', () => {
    expect(pageHead('login.sign-in')().meta).toEqual([{ title: 'Sign in · Parts Relay' }])
    expect(pageHead('login.sign-in', true)().meta).toContainEqual({
      name: 'robots',
      content: 'index, follow',
    })
  })
})
