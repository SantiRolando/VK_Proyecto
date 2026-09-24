// Guard de ruta: requiere un rol específico (`Admin` | `Customer`).

import { Navigate } from 'react-router'
import { useAuth } from '../../features/auth/auth-context.js'
import { routes } from '../routes.js'

export function RequireRole({ role, children }) {
  const { user, status } = useAuth()

  if (status === 'hydrating') return null

  if (!user || user.type !== role) {
    return <Navigate to={routes.home} replace />
  }

  return children
}
