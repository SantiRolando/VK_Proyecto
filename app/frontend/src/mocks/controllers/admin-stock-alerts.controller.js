/*
  Alertas de stock del panel. El listado devuelve todos los tipos, como el backend, y el tipo
  viaja en `alerType` con esa escritura.
*/

import { ApiError } from '@api/client/api-error.js'
import { alertStatusCodec, alertTypeCodec } from '@api/wire.js'
import { pageEnvelope } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

function serializeAlert(alert) {
  return {
    id: alert.id,
    variantId: alert.variantId,
    alerType: alertTypeCodec.encode(alert.alertType),
    notificationMode: alert.notificationMode,
    status: alertStatusCodec.encode(alert.status),
    createdAt: alert.createdAt,
    notifiedAt: alert.notifiedAt ?? null,
  }
}

register(
  'GET',
  '/admin/stock/alerts',
  (req) => {
    const db = getDb()
    const status = alertStatusCodec.decode(req.query.status ?? null)

    const rows = db.alerts
      .filter((alert) => !status || alert.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
      .map(serializeAlert)

    return { status: 200, data: pageEnvelope(rows, req.query) }
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/stock/alerts/:id/notify',
  (req) =>
    mutate((db) => {
      const alert = db.alerts.find((item) => item.id === Number(req.params.id))
      if (!alert) throw new ApiError(404, 'NOT_FOUND')
      if (alert.status !== 'Active') throw new ApiError(409, 'CONFLICT')

      alert.status = 'Notified'
      alert.notifiedAt = new Date().toISOString()

      return { status: 200, data: serializeAlert(alert) }
    }),
  { auth: 'admin' },
)
