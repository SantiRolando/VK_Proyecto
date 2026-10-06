/*
  Rangos de fecha para los filtros de administración (`?from=&to=`). Las fechas llegan
  como ISO-8601 o como `YYYY-MM-DD` (input de fecha del FE); sin hora, una fecha cubre
  el día completo cuando es el límite superior.
*/

export function timeOrNull(value, { endOfDay = false } = {}) {
  if (!value) return null
  const text = String(value)
  const normalized =
    endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T23:59:59.999Z` : text
  const time = new Date(normalized).getTime()
  return Number.isNaN(time) ? null : time
}

export function rangeFromQuery(query = {}) {
  return {
    from: timeOrNull(query.from),
    to: timeOrNull(query.to, { endOfDay: true }),
  }
}

export function inRange(iso, { from, to } = {}) {
  const time = new Date(iso).getTime()
  if (from != null && time < from) return false
  if (to != null && time > to) return false
  return true
}
