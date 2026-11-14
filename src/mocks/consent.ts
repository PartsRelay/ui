import { http, HttpResponse } from 'msw'

function cookiebot() {
  const saved = sessionStorage.getItem('mock.consent')
  const show = () => void window.dispatchEvent(new Event('CookiebotOnDialogDisplay'))

  window.Cookiebot = {
    consent: saved
      ? JSON.parse(saved)
      : { preferences: false, statistics: false, marketing: false },
    hide() {},
    renew: show,
    submitCustomConsent(preferences, statistics, marketing) {
      Object.assign(this.consent, { preferences, statistics, marketing })
      sessionStorage.setItem('mock.consent', JSON.stringify(this.consent))
    },
  } as typeof Cookiebot

  if (!saved && localStorage.getItem('mock.consent') === 'ask') show()
}

export const consentMocks = [
  http.get(
    'https://consent.cookiebot.com/uc.js',
    () => new HttpResponse(`(${cookiebot})()`, { headers: { 'content-type': 'text/javascript' } })
  ),
]
