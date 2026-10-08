/*
  Utilidades puras de i18n, testeables sin React: interpolación `{{var}}`, plantillas partidas
  para formatear cada parámetro, plurales vía `Intl.PluralRules` y formatos con `Intl`
  (`es-UY` / `en`).
*/

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

/*
  Parte una plantilla traducida en texto y parámetros. Sirve cuando un parámetro necesita su
  propio formato en pantalla (negrita, color) y `interpolate` no alcanza porque devuelve un
  string plano. Cada segmento es `{ text }` o `{ name }`, en el orden de la plantilla.
*/
export function splitTemplate(template) {
  const segments = []
  const pattern = /\{\{(\w+)\}\}/g
  let lastIndex = 0

  for (const match of template.matchAll(pattern)) {
    if (match.index > lastIndex) {
      segments.push({ text: template.slice(lastIndex, match.index) })
    }
    segments.push({ name: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < template.length) segments.push({ text: template.slice(lastIndex) })

  return segments
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
