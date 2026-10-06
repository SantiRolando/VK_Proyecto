// Seed de SETTING: reglas de negocio en clave-valor.

import { daysAgo } from '@mocks/db/seed/helpers.js'

export function buildSettings() {
  const updatedAt = daysAgo(10)
  return [
    { key: 'success_probability', value: '30', updatedAt },
    { key: 'points_per_feedback', value: '10', updatedAt },
    { key: 'max_daily_feedback', value: '5', updatedAt },
    { key: 'coordination_email', value: 'ventas@vikinga.com.uy', updatedAt },
    { key: 'coordination_whatsapp', value: '+59899000000', updatedAt },
    /*
      Sin TTL de reserva: pasados estos días el admin ve la venta como vieja y decide si
      moverla o cancelarla.
    */
    { key: 'stale_sale_days', value: '3', updatedAt },
  ]
}
