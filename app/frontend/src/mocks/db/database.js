/*
  Base de datos mock en memoria, con persistencia en localStorage. Todas las escrituras
  pasan por `mutate` para que el estado vivo y el persistido no se separen.
*/

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
