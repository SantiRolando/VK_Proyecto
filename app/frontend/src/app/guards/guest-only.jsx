// Guard de ruta: solo para usuarios sin sesión (login, registro…).
// Registro desde invitado queda permitido porque el invitado no tiene sesión.

import { routes } from '@app/routes.js'
import { useAuth } from '@features/auth/auth-context.js'
import { Navigate } from 'react-router'

export function GuestOnly({ children }) {
  const { isAuthenticated, status } = useAuth()

  if (status === 'hydrating') return null

  if (isAuthenticated) {
    return <Navigate to={routes.home} replace />
  }

  return children
}
