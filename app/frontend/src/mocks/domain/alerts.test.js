import { notifyRestockAlerts } from '@mocks/domain/alerts.js'
import { describe, expect, it } from 'vitest'

function dbWith(alerts) {
  return { alerts }
}

describe('alerts (reglas derivadas)', () => {
  it('pasa a Notified las alertas de reposición activas de la variante', () => {
    const db = dbWith([
      { id: 1, variantId: 10, alertType: 'RestockNotice', status: 'Active' },
      { id: 2, variantId: 10, alertType: 'RestockNotice', status: 'Active' },
      { id: 3, variantId: 10, alertType: 'RestockNotice', status: 'Notified' },
      { id: 4, variantId: 10, alertType: 'CriticalStock', status: 'Active' },
      { id: 5, variantId: 11, alertType: 'RestockNotice', status: 'Active' },
    ])

    expect(notifyRestockAlerts(db, 10)).toBe(2)
    expect(db.alerts.map((alert) => alert.status)).toEqual([
      'Notified',
      'Notified',
      'Notified',
      'Active',
      'Active',
    ])
  })

  it('no notifica nada si no hay alertas activas', () => {
    const db = dbWith([
      { id: 1, variantId: 10, alertType: 'RestockNotice', status: 'Closed' },
    ])
    expect(notifyRestockAlerts(db, 10)).toBe(0)
  })
})
