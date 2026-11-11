import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test'
import {
  answerCookiebot,
  choose,
  reopenCookiebot,
  watchCookiebot,
} from '@/modules/consent/core/cookiebot'

const cookiebot = {
  consent: { necessary: true, preferences: true, statistics: false, marketing: false },
  hide: vi.fn(),
  renew: vi.fn(),
  submitCustomConsent: vi.fn(),
}

const scripts: unknown[] = []

beforeEach(() => {
  vi.stubGlobal('window', Object.assign(new EventTarget(), { Cookiebot: cookiebot }))
  vi.stubGlobal('document', {
    getElementById: () => scripts[0] ?? null,
    createElement: () => ({ dataset: {} }),
    head: { append: (script: unknown) => scripts.push(script) },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  scripts.length = 0
})

test('loads the Cookiebot script once, without its widget', () => {
  watchCookiebot(() => {})
  watchCookiebot(() => {})

  expect(scripts).toEqual([
    {
      id: 'Cookiebot',
      src: 'https://consent.cookiebot.com/uc.js',
      async: true,
      dataset: { cbid: '', widgetEnabled: 'false' },
    },
  ])
})

test('asks with the current choices in place of the Cookiebot dialog', () => {
  const ask = vi.fn()
  const stop = watchCookiebot(ask)

  window.dispatchEvent(new Event('CookiebotOnDialogDisplay'))

  expect(cookiebot.hide).toHaveBeenCalledOnce()
  expect(ask).toHaveBeenCalledExactlyOnceWith({
    preferences: true,
    statistics: false,
    marketing: false,
  })

  stop()
  window.dispatchEvent(new Event('CookiebotOnDialogDisplay'))

  expect(ask).toHaveBeenCalledOnce()
})

test('sends the answer and asks again on request', () => {
  answerCookiebot(choose(false))
  answerCookiebot({ ...choose(true), marketing: false })
  reopenCookiebot()

  expect(cookiebot.submitCustomConsent.mock.calls).toEqual([
    [false, false, false],
    [true, true, false],
  ])
  expect(cookiebot.renew).toHaveBeenCalledOnce()
})
