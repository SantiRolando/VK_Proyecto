// Seed: SETTING (configuración de reglas de negocio, clave-valor).
// Claves del ERD más las extensiones de contacto del plan (Q-09).

import { daysAgo } from '@mocks/db/seed/helpers.js'

export function buildSettings() {
  const updatedAt = daysAgo(10)
  return [
    { key: 'success_probability', value: '30', updatedAt },
    { key: 'points_per_feedback', value: '10', updatedAt },
    { key: 'max_daily_feedback', value: '5', updatedAt },
    { key: 'coordination_email', value: 'ventas@vikinga.com.uy', updatedAt },
    { key: 'coordination_whatsapp', value: '+59899000000', updatedAt },
    // Q-11: sin TTL de reserva. A partir de estos días el admin ve la venta
    // como "vieja" y decide si la mueve o la cancela.
    { key: 'stale_sale_days', value: '3', updatedAt },
  ]
}
