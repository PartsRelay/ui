import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'

export const categories = ['preferences', 'statistics', 'marketing'] as const

export type Choices = Record<(typeof categories)[number], boolean>

declare global {
  interface Window {
    Cookiebot?: {
      consent: Choices
      hide(): void
      renew(): void
      submitCustomConsent(preferences: boolean, statistics: boolean, marketing: boolean): void
    }
  }
}

export const cookiebotEnabled = Boolean(env.COOKIEBOT_ID) || mocksEnabled

export const choose = (granted: boolean): Choices => ({
  preferences: granted,
  statistics: granted,
  marketing: granted,
})

export function watchCookiebot(ask: (choices: Choices) => void) {
  const show = () => {
    const { preferences, statistics, marketing } = window.Cookiebot!.consent

    window.Cookiebot!.hide()
    ask({ preferences, statistics, marketing })
  }

  window.addEventListener('CookiebotOnDialogDisplay', show)

  if (!document.getElementById('Cookiebot')) {
    const script = document.createElement('script')

    script.id = 'Cookiebot'
    script.src = 'https://consent.cookiebot.com/uc.js'
    script.async = true
    script.dataset.cbid = env.COOKIEBOT_ID ?? ''
    script.dataset.widgetEnabled = 'true'
    document.head.append(script)
  }

  return () => window.removeEventListener('CookiebotOnDialogDisplay', show)
}

export function answerCookiebot({ preferences, statistics, marketing }: Choices) {
  window.Cookiebot?.submitCustomConsent(preferences, statistics, marketing)
}
