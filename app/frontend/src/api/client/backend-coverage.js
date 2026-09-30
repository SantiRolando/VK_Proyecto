// Rutas que ya implementa la API real. En modo `hybrid` estas van al backend y
// el resto al mock; a medida que el backend suma módulos (stock, ventas,
// cupones, puntos, analítica) se agregan acá y se borran del mock.

const COVERED = [
  ['POST', /^\/auth\/(register|login|refresh|logout)$/],
  ['POST', /^\/auth\/otp\/(request|login|reset-password)$/],
  ['GET', /^\/auth\/me$/],
  ['POST', /^\/public\/fit\/recommend$/],
  ['GET', /^\/public\/fit\/generations\/\d+$/],
  ['GET', /^\/public\/(sizes|contact)$/],
  ['GET', /^\/fit\/generations(\/\d+)?$/],
  ['*', /^\/profiles(\/\d+(\/default)?)?$/],
  ['*', /^\/addresses(\/\d+(\/default)?)?$/],
  ['*', /^\/admin\/catalog\/products(\/.*)?$/],
]

export function isBackendRoute(method, url) {
  const path = String(url).split('?')[0]
  const verb = String(method).toUpperCase()
  return COVERED.some(
    ([allowed, pattern]) => (allowed === '*' || allowed === verb) && pattern.test(path),
  )
}
