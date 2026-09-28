import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
// Matchers de jest-dom (`toBeInTheDocument`, `toHaveValue`, …) sobre expect.
import '@testing-library/jest-dom/vitest'

// jsdom + transporte mock tardan más que el segundo por defecto en dejar la
// pantalla estable: se espera un poco más antes de dar una consulta por fallida.
configure({ asyncUtilTimeout: 3000 })

// Estado global compartido por los tests de la capa de datos:
// cada test arranca con localStorage limpio (la DB mock persiste ahí).
afterEach(() => {
  window.localStorage.clear()
})

// Los tests de componentes montan el router real: se desmonta el árbol entre
// tests. Testing Library no registra el cleanup solo porque los globals de
// vitest están desactivados.
afterEach(() => {
  cleanup()
})

// APIs del navegador que jsdom no implementa y que usan Mantine (`useMediaQuery`)
// y el checkout. Sin `matches`, la app se renderiza en su layout de escritorio.
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

window.ResizeObserver = ResizeObserverStub
Element.prototype.scrollIntoView = () => {}
