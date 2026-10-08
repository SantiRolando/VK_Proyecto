/*
  Guard de ruta: requiere un administrador, que es el único permiso que la app distingue. Mientras
  se rehidrata la sesión no se decide nada: redirigir ahí expulsaría a quien tiene sesión guardada.
*/

import { useAuth } from '@features/auth/auth-context.js'
import { homeRoute, isAdmin } from '@features/auth/permissions.js'
import { Navigate } from 'react-router'

export function RequireAdmin({ children }) {
  const { user, status } = useAuth()

  if (status === 'hydrating') return null

  if (!isAdmin(user)) {
    return <Navigate to={homeRoute(user)} replace />
  }

  return children
}
