export function formatLocale(language: string, preferred: readonly string[] = navigator.languages) {
  const [base] = language.split('-')

  return preferred.find((locale) => locale.split('-')[0] === base) ?? language
}
