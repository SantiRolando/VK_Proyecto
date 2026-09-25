// Reglas derivadas de ALERT (§5.3 del plan).
//
// Al reponer una variante que estaba en 0, las alertas de reposición
// ('RestockNotice') activas de esa variante pasan a 'Notified'. Lo llama el
// controller de movimientos de stock cuando un ingreso lleva la variante de
// disponible 0 a > 0 (US9).

export function notifyRestockAlerts(db, variantId) {
  const pending = db.alerts.filter(
    (alert) =>
      alert.variantId === variantId &&
      alert.alertType === 'RestockNotice' &&
      alert.status === 'Active',
  )

  for (const alert of pending) {
    alert.status = 'Notified'
  }

  return pending.length
}
