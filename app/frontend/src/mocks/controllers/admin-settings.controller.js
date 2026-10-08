/*
  Reglas del juego. La tabla SETTING es clave-valor con claves snake_case del ERD; acá se
  expone un DTO en camelCase y se valida la edición en bloque (`PATCH`). Los valores los
  leen los controllers de negocio.

  El catálogo de campos, sus rangos y sus valores por defecto vienen del contrato del
  service: una copia local se desincroniza de la pantalla sin que nada avise.
*/

import { ApiError } from '@api/client/api-error.js'
import { isIntegerField, SETTINGS_FIELDS } from '@api/services/admin-settings-service.js'
import { getDb, mutate } from '@mocks/db/database.js'
import { settingNumber, settingValue } from '@mocks/domain/settings.js'
import { register } from '@mocks/router/mock-router.js'

const FIELD_BY_NAME = Object.fromEntries(
  SETTINGS_FIELDS.map((field) => [field.name, field]),
)

function serializeSettings(db) {
  return Object.fromEntries(
    SETTINGS_FIELDS.map((field) => [
      field.name,
      isIntegerField(field)
        ? settingNumber(db.settings, field.key, field.fallback)
        : settingValue(db.settings, field.key, field.fallback),
    ]),
  )
}

function validateInteger(field, value) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < field.min || number > field.max) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: [field.name] })
  }
  return number
}

register(
  'GET',
  '/admin/settings',
  () => {
    const db = getDb()
    return { status: 200, data: serializeSettings(db) }
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/settings',
  (req) => {
    const unknown = Object.keys(req.body).filter((name) => !FIELD_BY_NAME[name])
    if (unknown.length > 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: unknown })
    }
    if (Object.keys(req.body).length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['body'] })
    }

    return mutate((db) => {
      const now = new Date().toISOString()

      for (const [name, rawValue] of Object.entries(req.body)) {
        const field = FIELD_BY_NAME[name]
        const value = isIntegerField(field)
          ? String(validateInteger(field, rawValue))
          : String(rawValue).trim()

        // Un canal de contacto vacío dejaría la derivación sin destino.
        if (!isIntegerField(field) && !value) {
          throw new ApiError(422, 'VALIDATION_ERROR', { fields: [name] })
        }

        const setting = db.settings.find((item) => item.key === field.key)
        if (setting) {
          setting.value = value
          setting.updatedAt = now
        } else {
          db.settings.push({ key: field.key, value, updatedAt: now })
        }
      }

      return { status: 200, data: serializeSettings(db) }
    })
  },
  { auth: 'admin' },
)
