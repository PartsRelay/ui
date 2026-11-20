import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'
import { formatLocale } from '@/core/format-locale'

const files = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', {
  eager: true,
  import: 'default',
})

const resources: Record<string, { translation: Record<string, unknown> }> = {}
for (const [path, messages] of Object.entries(files)) {
  const [, , locale, file] = path.split('/')
  resources[locale] ??= { translation: {} }
  resources[locale].translation[file.replace(/\.json$/, '')] = messages
}

export const locales = Object.keys(resources)

let textCountry: string | null = null

const icu = new ICU({ parseLngForICU: (language) => formatLocale(language, textCountry) })

// Numbers in texts follow this country, else the language
export function setTextCountry(country: string | null) {
  if (country === textCountry) return

  textCountry = country
  icu.clearCache()
  i18n.emit('languageChanged', i18n.language)
}

i18n.on('languageChanged', (language) =>
  globalThis.document?.documentElement.setAttribute('lang', language)
)

void i18n
  .use(icu)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: locales,
    load: 'currentOnly',
    fallbackLng: 'en-US',
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    parseMissingKeyHandler: (key) =>
      key.startsWith('errors.') ? i18n.t('errors.unknown-error') : key,
  })

export { i18n }
