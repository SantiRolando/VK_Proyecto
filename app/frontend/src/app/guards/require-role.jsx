// Guard de ruta: requiere un rol específico (`Admin` | `Customer`).

import { routes } from '@app/routes.js'
import { useAuth } from '@features/auth/auth-context.js'
import { Navigate } from 'react-router'
// Guard de ruta: requiere un rol específico (`Admin` | `Customer`).
// La prop se llama `requiredRole` para no confundirse con el atributo ARIA `role`.

export function RequireRole({ requiredRole, children }) {
  const { user, status } = useAuth()

  if (status === 'hydrating') return null

  if (!user || user.type !== requiredRole) {
    return <Navigate to={routes.home} replace />
  }

  return children
}
