// Líneas de prenda: slug de URL (inglés, minúsculas) ↔ valor del ERD.
// `/fit?line=endurance` (y su alias `linea=`) se resuelve con `slugToLine`.

import { Line } from '@constants/enums.js'

export const LINE_SLUGS = {
  endurance: Line.Endurance,
  soft: Line.Soft,
  jammer: Line.Jammer,
  sunga: Line.Sunga,
  kids: Line.Kids,
}

export function slugToLine(slug) {
  return LINE_SLUGS[String(slug ?? '').toLowerCase()] ?? null
}

export function lineToSlug(line) {
  const entry = Object.entries(LINE_SLUGS).find(([, value]) => value === line)
  return entry?.[0] ?? null
}
