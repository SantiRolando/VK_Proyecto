import { useI18n } from '@i18n/context.js'

// Monto en UYU con el formato del idioma activo (`es-UY` / `en`).
export function Money({ value }) {
  const { formatCurrency } = useI18n()
  return <span>{formatCurrency(value)}</span>
}
