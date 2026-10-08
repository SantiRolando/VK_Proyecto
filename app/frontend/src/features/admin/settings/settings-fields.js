/*
  Ayudas de presentación sobre el contrato de `SETTINGS_FIELDS`: buscar un campo por nombre y
  llevar un valor a su rango. Los números siguen viviendo en el contrato, no acá.
*/

import { SETTINGS_FIELDS } from '@api/services/admin-settings-service.js'

export const FIELD_BY_NAME = Object.fromEntries(
  SETTINGS_FIELDS.map((field) => [field.name, field]),
)

// Mientras se escribe, el campo puede quedar vacío: se lleva al rango del contrato.
export function clampToField(field, value) {
  const number = Math.round(Number(value) || 0)
  return Math.min(field.max, Math.max(field.min, number))
}
