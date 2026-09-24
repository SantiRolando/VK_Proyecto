// Guard de ruta: solo para usuarios sin sesión (login, registro…).
// Registro desde invitado queda permitido porque el invitado no tiene sesión.

import { Navigate } from 'react-router'
import { useAuth } from '../../features/auth/auth-context.js'
import { routes } from '../routes.js'

export function GuestOnly({ children }) {
  const { isAuthenticated, status } = useAuth()

  if (status === 'hydrating') return null

  if (isAuthenticated) {
    return <Navigate to={routes.home} replace />
  }

  return children
}
