// Líneas y públicos: slug de URL (inglés, minúsculas) ↔ valor del modelo.
// `/fit?line=jammer&audience=kids` (alias `linea=`) se resuelve acá.

import { Audience, Line } from '@constants/enums.js'

export const LINE_SLUGS = {
  endurance: Line.Endurance,
  soft: Line.Soft,
  jammer: Line.Jammer,
  sunga: Line.Sunga,
}

export const AUDIENCE_SLUGS = {
  adult: Audience.Adult,
  kids: Audience.Kids,
}

export function slugToLine(slug) {
  return LINE_SLUGS[String(slug ?? '').toLowerCase()] ?? null
}

export function lineToSlug(line) {
  const entry = Object.entries(LINE_SLUGS).find(([, value]) => value === line)
  return entry?.[0] ?? null
}

export function slugToAudience(slug) {
  return AUDIENCE_SLUGS[String(slug ?? '').toLowerCase()] ?? null
}

export function audienceToSlug(audience) {
  const entry = Object.entries(AUDIENCE_SLUGS).find(([, value]) => value === audience)
  return entry?.[0] ?? null
}
