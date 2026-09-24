// Estado de sesión a nivel transporte: token de acceso, snapshot del usuario
// y `guestSessionId` del dispositivo. Vive fuera de React para que `api-client`
// pueda adjuntar las cabeceras sin depender del árbol de componentes.
//
// Solo prototipo: el token se guarda en localStorage (R-15 del plan).

const SESSION_KEY = 'vkfit.session'
const GUEST_KEY = 'vkfit.guest'

let onUnauthorized = null

export function setOnUnauthorized(handler) {
  onUnauthorized = handler
}

export function notifyUnauthorized() {
  onUnauthorized?.()
}

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }))
  } catch {
    // localStorage lleno o no disponible: la sesión vive solo en memoria.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignorar
  }
}

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = (Math.random() * 16) | 0
    const v = char === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Identificador persistente del invitado en el dispositivo (FR-008).
// Si el navegador lo pierde se crea uno nuevo (caso borde aceptado).
export function getGuestSessionId() {
  let id
  try {
    id = window.localStorage.getItem(GUEST_KEY)
  } catch {
    id = null
  }
  if (!id) {
    id = createUuid()
    try {
      window.localStorage.setItem(GUEST_KEY, id)
    } catch {
      // ignorar: se regenerará en la próxima lectura.
    }
  }
  return id
}

export function resetGuestSessionId() {
  try {
    window.localStorage.removeItem(GUEST_KEY)
  } catch {
    // ignorar
  }
}
