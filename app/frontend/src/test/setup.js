import { afterEach } from 'vitest'

// Estado global compartido por los tests de la capa de datos:
// cada test arranca con localStorage limpio (la DB mock persiste ahí).
afterEach(() => {
  window.localStorage.clear()
})
