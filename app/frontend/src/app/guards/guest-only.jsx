/*
  Guard de ruta: solo para usuarios sin sesión (login, registro…). Mientras se rehidrata la
  sesión no se decide nada: redirigir ahí trataría como invitado a quien ya tiene sesión
  guardada.
*/

import { routes } from '@app/routes.js'
import { useAuth } from '@features/auth/auth-context.js'
import { Navigate } from 'react-router'

export function GuestOnly({ children }) {
  const { isAuthenticated, status } = useAuth()

  if (status === 'hydrating') return null

  if (isAuthenticated) {
    return <Navigate to={routes.account} replace />
  }

  return children
}
