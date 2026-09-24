// Utilidades puras de i18n (testeables sin React):
// interpolación `{{var}}`, plurales vía Intl.PluralRules y formatos con Intl
// (`es-UY` / `en`) — R-06 del plan.

export const LOCALES = { es: 'es-UY', en: 'en' }

export function detectBrowserLanguage() {
  const language = typeof navigator !== 'undefined' ? navigator.language : 'es'
  return language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function interpolate(template, params) {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match,
  )
}

// Los locales solo definen formas `one` / `other`.
export function selectPluralForm(language, count) {
  const locale = language === 'es' ? 'es' : 'en'
  const form = new Intl.PluralRules(locale).select(count)
  return form === 'one' ? 'one' : 'other'
}

export function translateKey(messages, language, key, params) {
  const count = params && typeof params.count === 'number' ? params.count : null

  let template
  if (count !== null) {
    const form = selectPluralForm(language, count)
    template = messages[language]?.[`${key}.${form}`] ?? messages[language]?.[key]
  } else {
    template = messages[language]?.[key]
  }

  // Fallback: español → clave cruda (nunca un string vacío).
  if (template === undefined) template = messages.es?.[key] ?? key

  return interpolate(template, params)
}

export function formatNumberValue(language, value, options) {
  return new Intl.NumberFormat(LOCALES[language] ?? language, options).format(value)
}

export function formatDateValue(language, value, options) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(LOCALES[language] ?? language, options).format(date)
}

export function formatCurrencyValue(language, value) {
  return new Intl.NumberFormat(LOCALES[language] ?? language, {
    style: 'currency',
    currency: 'UYU',
  }).format(value)
}
