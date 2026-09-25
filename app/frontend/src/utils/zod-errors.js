// Colecta los errores de formato de una validación zod en un mapa
// `{ [campo]: <código> }`, listo para los formularios. Los códigos se
// resuelven con `validation.<código>` (required / invalid / password / phone).

const KNOWN_CODES = new Set(['required', 'invalid', 'password', 'phone'])

export function collectFieldErrors(error) {
  const next = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (field && next[field] === undefined) {
      next[field] = KNOWN_CODES.has(issue.message) ? issue.message : 'invalid'
    }
  }
  return next
}
