import { http, HttpResponse } from 'msw'

function cookiebot() {
  const saved = sessionStorage.getItem('mock.consent')
  const show = () => window.dispatchEvent(new Event('CookiebotOnDialogDisplay'))

  window.Cookiebot = {
    consent: saved
      ? JSON.parse(saved)
      : { preferences: false, statistics: false, marketing: false },
    hide() {},
    renew: show,
    submitCustomConsent(preferences, statistics, marketing) {
      this.consent = { preferences, statistics, marketing }
      sessionStorage.setItem('mock.consent', JSON.stringify(this.consent))
    },
  }

  if (!saved && localStorage.getItem('mock.consent') === 'ask') show()
}

export const consentMocks = [
  http.get(
    'https://consent.cookiebot.com/uc.js',
    () => new HttpResponse(`(${cookiebot})()`, { headers: { 'content-type': 'text/javascript' } })
  ),
]
