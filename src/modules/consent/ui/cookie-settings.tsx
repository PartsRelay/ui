import { useTranslation } from 'react-i18next'
import { cookiebotEnabled, reopenCookiebot } from '@/modules/consent/core/cookiebot'

export function CookieSettings() {
  const { t } = useTranslation()

  return (
    cookiebotEnabled && (
      <>
        <button
          type="button"
          className="underline-offset-4 hover:underline"
          onClick={reopenCookiebot}
        >
          {t('consent.settings')}
        </button>
        <span aria-hidden>·</span>
      </>
    )
  )
}
