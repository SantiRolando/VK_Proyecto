/*
  Guard de ruta: requiere un rol específico (`Admin` | `Customer`). La prop se llama
  `requiredRole` para no confundirse con el atributo ARIA `role`. Mientras se rehidrata la
  sesión no se decide nada: redirigir ahí expulsaría a quien tiene sesión guardada.
*/

import { routes } from '@app/routes.js'
import { useAuth } from '@features/auth/auth-context.js'
import { Navigate } from 'react-router'

export function RequireRole({ requiredRole, children }) {
  const { user, status } = useAuth()

  if (status === 'hydrating') return null

  if (!user || user.type !== requiredRole) {
    return <Navigate to={routes.account} replace />
  }

  return children
}
