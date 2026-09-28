// Colores de producto: dato del catálogo (no se traduce, §4.7). Se mapea el
// valor estable del ERD a un hex para el swatch visual.

const COLOR_SWATCHES = {
  black: '#111827',
  white: '#f3f4f6',
  navy: '#1e3a5f',
  blue: '#2563eb',
  red: '#dc2626',
  pink: '#ec4899',
  green: '#16a34a',
  purple: '#7c3aed',
}

export function colorHex(color) {
  return COLOR_SWATCHES[color] ?? '#9ca3af'
}

// Opciones del alta/edición de variantes en el panel (US9).
export const COLOR_OPTIONS = Object.keys(COLOR_SWATCHES)

// Etiqueta del color tal cual el dato (capitalizada para mostrar).
export function colorLabel(color) {
  const value = String(color ?? '')
  return value.charAt(0).toUpperCase() + value.slice(1)
}
