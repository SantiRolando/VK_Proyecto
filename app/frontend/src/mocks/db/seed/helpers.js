/*
  Helpers del seed: PRNG con semilla fija para que los datos de demo se repitan, y fechas
  relativas a hoy para que el dashboard siempre encuentre rangos con datos.
*/

// mulberry32: PRNG con semilla fija, para que el seed sea reproducible.
export function createRandom(seedValue) {
  let state = seedValue >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick(random, items) {
  return items[Math.floor(random() * items.length)]
}

export function between(random, min, max) {
  return min + Math.floor(random() * (max - min + 1))
}

export function daysAgo(days, hour = 12) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export function daysFromNow(days, hour = 12) {
  return daysAgo(-days, hour)
}

// Punto medio de un rango [min, max], tolerante a `null`.
export function midpoint(range) {
  if (!range) return null
  return Math.round(((range[0] + range[1]) / 2) * 10) / 10
}
