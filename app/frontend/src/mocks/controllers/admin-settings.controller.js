/*
  Reglas del juego. La tabla SETTING es clave-valor con claves snake_case del ERD; acá se
  expone un DTO en camelCase y se valida la edición en bloque (`PATCH`). Los valores los
  leen los controllers de negocio.
*/

import { ApiError } from '@api/client/api-error.js'
import { getDb, mutate } from '@mocks/db/database.js'
import { settingNumber, settingValue } from '@mocks/domain/settings.js'
import { register } from '@mocks/router/mock-router.js'

// DTO ↔ SETTING: el FE nunca ve las claves del ERD.
const FIELDS = {
  successProbability: 'success_probability',
  pointsPerFeedback: 'points_per_feedback',
  maxDailyFeedback: 'max_daily_feedback',
  coordinationEmail: 'coordination_email',
  coordinationWhatsapp: 'coordination_whatsapp',
  staleSaleDays: 'stale_sale_days',
}

const INTEGER_FIELDS = {
  successProbability: { min: 0, max: 100 },
  pointsPerFeedback: { min: 0, max: 1000 },
  maxDailyFeedback: { min: 0, max: 100 },
  staleSaleDays: { min: 0, max: 365 },
}

function serializeSettings(db) {
  return Object.fromEntries(
    Object.entries(FIELDS).map(([field, key]) =>
      INTEGER_FIELDS[field]
        ? [field, settingNumber(db.settings, key, 0)]
        : [field, settingValue(db.settings, key, '')],
    ),
  )
}

function validateInteger(field, value) {
  const { min, max } = INTEGER_FIELDS[field]
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: [field] })
  }
  return number
}

register(
  'GET',
  '/admin/settings',
  () => {
    const db = getDb()
    return {
      status: 200,
      data: serializeSettings(db),
      meta: {
        updatedAt: db.settings.reduce(
          (latest, setting) =>
            !latest || new Date(setting.updatedAt) > new Date(latest)
              ? setting.updatedAt
              : latest,
          null,
        ),
      },
    }
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/settings',
  (req) => {
    const unknown = Object.keys(req.body).filter((field) => !FIELDS[field])
    if (unknown.length > 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: unknown })
    }
    if (Object.keys(req.body).length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['body'] })
    }

    return mutate((db) => {
      const now = new Date().toISOString()

      for (const [field, rawValue] of Object.entries(req.body)) {
        const key = FIELDS[field]
        const value = INTEGER_FIELDS[field]
          ? String(validateInteger(field, rawValue))
          : String(rawValue).trim()

        if (!INTEGER_FIELDS[field] && !value) {
          throw new ApiError(422, 'VALIDATION_ERROR', { fields: [field] })
        }

        const setting = db.settings.find((item) => item.key === key)
        if (setting) {
          setting.value = value
          setting.updatedAt = now
        } else {
          db.settings.push({ key, value, updatedAt: now })
        }
      }

      return { status: 200, data: serializeSettings(db) }
    })
  },
  { auth: 'admin' },
)
