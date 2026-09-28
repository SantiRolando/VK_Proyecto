import { useI18n } from '@i18n/context.js'

// Fecha/hora con el formato del idioma activo (`es-UY` / `en`).
// `options` se pasa directo a Intl.DateTimeFormat (p. ej. { dateStyle: 'medium' }).
export function DateTime({ value, options }) {
  const { formatDate } = useI18n()
  if (!value) return null
  return <span>{formatDate(value, options)}</span>
}
