// Controller de configuración pública (US1): destino de contacto de VK para
// la derivación a atención personalizada (fuera de rango). Los valores viven
// en SETTING (R-12); el CRUD admin llega en US11.

import { getDb } from '@mocks/db/database.js'
import { settingValue } from '@mocks/domain/settings.js'
import { register } from '@mocks/router/mock-router.js'

register('GET', '/public/contact', () => {
  const db = getDb()
  const email = settingValue(db.settings, 'coordination_email')
  const whatsapp = settingValue(db.settings, 'coordination_whatsapp')
  // Como en el backend: un canal sin configurar no aparece en la respuesta.
  const data = {}
  if (email) data.email = email
  if (whatsapp) data.whatsapp = whatsapp
  return { status: 200, data }
})
