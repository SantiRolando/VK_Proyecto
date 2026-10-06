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
  return COLOR_SWATCHES[String(color ?? '').toLowerCase()] ?? '#9ca3af'
}
export const COLOR_OPTIONS = Object.keys(COLOR_SWATCHES)

export function colorLabel(color) {
  const value = String(color ?? '')
  return value.charAt(0).toUpperCase() + value.slice(1)
}
