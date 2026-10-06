/*
  Reglas derivadas de ALERT. Al reponer una variante que estaba en 0, sus alertas de
  reposición (`RestockNotice`) activas pasan a `Notified`. Lo llama el controller de
  movimientos de stock cuando un ingreso lleva el disponible de 0 a > 0.
*/

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
