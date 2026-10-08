/*
  Guard de ruta: solo para usuarios sin sesión (login, registro…). Mientras se rehidrata la
  sesión no se decide nada: redirigir ahí trataría como invitado a quien ya tiene sesión
  guardada.
*/

import { useAuth } from '@features/auth/auth-context.js'
import { homeRoute } from '@features/auth/permissions.js'
import { Navigate } from 'react-router'

export function GuestOnly({ children }) {
  const { user, status } = useAuth()

  if (status === 'hydrating') return null

  if (user) {
    return <Navigate to={homeRoute(user)} replace />
  }

  return children
}
