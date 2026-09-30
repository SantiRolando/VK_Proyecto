// Persistencia de la DB mock en localStorage (R-07 del plan).
// Versionada: si cambia el esquema se sube `VERSION` y se re-siembra.
// Nunca debe tirar: ante quota o storage no disponible se ignora.

const KEY = 'vkfit.mockdb.v2'
const VERSION = 2

export function loadPersisted() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== VERSION || !parsed.db) return null
    return parsed.db
  } catch {
    return null
  }
}

export function persist(db) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: VERSION, db }))
  } catch {
    // quota excedida o storage no disponible: el mock sigue en memoria.
  }
}

export function clearPersisted() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignorar
  }
}
