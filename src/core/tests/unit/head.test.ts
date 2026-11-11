import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { appHead, pageHead } from '@/core/head'
import { env } from '@/env'

function visit(href: string) {
  vi.stubGlobal('window', { location: new URL(href) })
}

describe('head', () => {
  afterEach(() => {
    Object.assign(env, { SITE_URL: undefined })
  })

  it('names the address of the page without its search and keeps it out of search engines', () => {
    visit('https://app.example.com/lookups?status=done#top')

    const { meta, links } = appHead()
    const address = 'https://app.example.com/lookups'

    expect(links).toEqual([{ rel: 'canonical', href: address }])
    expect(meta).toContainEqual({ property: 'og:url', content: address })
    expect(meta).toContainEqual({ name: 'twitter:url', content: address })
    expect(meta).toContainEqual({ name: 'robots', content: 'noindex' })
  })

  it('names the address on the public site when it is set', () => {
    visit('https://preview.example.com/login')
    Object.assign(env, { SITE_URL: 'https://app.example.com' })

    expect(appHead().links).toEqual([{ rel: 'canonical', href: 'https://app.example.com/login' }])
  })

  it('titles a page and opens only an indexed one to search engines', () => {
    expect(pageHead('login.sign-in')().meta).toEqual([{ title: 'Sign in · Parts Relay' }])
    expect(pageHead('login.sign-in', true)().meta).toContainEqual({
      name: 'robots',
      content: 'index, follow',
    })
  })
})
