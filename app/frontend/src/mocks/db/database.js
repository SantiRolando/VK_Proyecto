// Base de datos mock en memoria + persistencia en localStorage (R-07).
//
// - `getDb()` devuelve el estado vivo.
// - `mutate(fn)` ejecuta `fn(db)` y persiste (usar para toda escritura).
// - `resetDatabase()` re-siembra y persiste (botón de `/dev`).
// - `nextId(items)` genera el próximo id numérico de una colección.

import { loadPersisted, persist } from '@mocks/db/persistence.js'
import { seedDatabase } from '@mocks/db/seed/seed.js'

let db = loadPersisted() ?? seedDatabase()

export function getDb() {
  return db
}

export function resetDatabase() {
  db = seedDatabase()
  persist(db)
  return db
}

export function mutate(fn) {
  const result = fn(db)
  persist(db)
  return result
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1
}
