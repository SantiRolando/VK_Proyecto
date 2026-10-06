/*
  Estado de sesión a nivel transporte: access token (con su vencimiento), refresh token,
  snapshot del usuario y `guestSessionId` del dispositivo. Vive fuera de React para que
  `api-client` adjunte las cabeceras sin depender del árbol de componentes.

  Los tokens se guardan en localStorage y el refresh token es de un solo uso: se reemplaza en
  cada renovación.
*/

const SESSION_KEY = 'vkfit.session'
const GUEST_KEY = 'vkfit.guest'
const API_CACHE = 'vkfit-api-get'

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

// `expiresInSeconds` viene del backend; sin dato el token se toma por vigente.
export function setSession(token, user, refreshToken = null, expiresInSeconds = null) {
  try {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        token,
        refreshToken: refreshToken ?? null,
        expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null,
        user,
      }),
    )
  } catch {
    // localStorage lleno o no disponible: la sesión vive solo en memoria.
  }
}

// Actualiza el usuario sin tocar tokens ni vencimiento (hidratación de /auth/me).
export function setSessionUser(user) {
  const session = getSession()
  if (!session) return
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user }))
  } catch {
    // localStorage lleno o no disponible: la sesión vive solo en memoria.
  }
}

// Vencido, o a punto de vencer: conviene renovar antes de pedir.
export function isAccessTokenExpired(session, marginMs = 30_000) {
  return Boolean(session?.expiresAt) && session.expiresAt - marginMs <= Date.now()
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {}
  /*
    El service worker cachea GETs públicos; lo privado nunca se cachea, pero se limpia igual
    para que otro usuario del dispositivo no herede nada.
  */
  try {
    if (typeof caches !== 'undefined') caches.delete(API_CACHE)
  } catch {}
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

/*
  Identificador persistente del invitado en el dispositivo, un UUID como exige el backend. Si
  el navegador lo pierde se crea uno nuevo.
*/
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

/*
  Se rota al entrar y al salir: las mediciones de invitado ya pasaron a la cuenta, y las que
  haga el próximo invitado del dispositivo no deben ir a parar a la cuenta de quien se logueó
  antes.
*/
export function resetGuestSessionId() {
  try {
    window.localStorage.removeItem(GUEST_KEY)
  } catch {}
}
