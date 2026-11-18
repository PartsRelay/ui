type HourCycles = { getHourCycles?: () => string[]; hourCycles?: string[] }

export function formatLocale(language: string, country?: string | null) {
  if (!country) return language

  const [base] = language.split('-')
  const tag = `${base}-${country}`
  const known = new Intl.DateTimeFormat(tag).resolvedOptions().locale === tag
  const regional = known ? tag : base === 'en' ? 'en-150' : language
  const locale: Intl.Locale & HourCycles = new Intl.Locale(tag)
  const [hourCycle] = locale.getHourCycles?.() ?? locale.hourCycles ?? []

  return hourCycle ? `${regional}-u-hc-${hourCycle}` : regional
}
