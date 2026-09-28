// Controller de configuración pública (US1): destino de contacto de VK para
// la derivación a atención personalizada (fuera de rango). Los valores viven
// en SETTING (R-12); el CRUD admin llega en US11.

import { ApiError } from '@api/client/api-error.js'
import { getDb } from '@mocks/db/database.js'
import { settingValue } from '@mocks/domain/settings.js'
import { register } from '@mocks/router/mock-router.js'

register('GET', '/public/contact', () => {
  const db = getDb()
  const email = settingValue(db.settings, 'coordination_email')
  const whatsapp = settingValue(db.settings, 'coordination_whatsapp')
  if (!email && !whatsapp) {
    throw new ApiError(404, 'NOT_FOUND')
  }
  return { status: 200, data: { email, whatsapp } }
})
