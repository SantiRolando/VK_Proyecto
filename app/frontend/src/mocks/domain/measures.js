// Medidas del cuerpo compartidas por SIZE_GENERATION y MEASUREMENT_PROFILE
// (§5.2): se guardan como números positivos en centímetros.

import { ApiError } from '@api/client/api-error.js'

export const MEASURE_FIELDS = ['height', 'bust', 'waist', 'hip', 'torso']

// Devuelve las cinco medidas normalizadas (números) o 422 con los campos
// faltantes/invalidos. El rango por línea lo resuelve el motor de talle.
export function readMeasures(body) {
  const measures = {}
  const fields = []

  for (const field of MEASURE_FIELDS) {
    const raw = body[field]
    const value = Number(raw)
    const valid =
      raw !== null &&
      raw !== undefined &&
      raw !== '' &&
      Number.isFinite(value) &&
      value > 0

    if (!valid) {
      fields.push(field)
      continue
    }
    measures[field] = value
  }

  if (fields.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields })
  }

  return measures
}

export function hasMeasures(body) {
  return MEASURE_FIELDS.some((field) => body[field] !== undefined)
}
