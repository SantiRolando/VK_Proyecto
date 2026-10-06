/*
  Guard de ruta: requiere sesión activa. Redirige a login con `returnTo` para volver al punto
  donde estaba. Mientras se rehidrata la sesión no se decide nada: redirigir ahí expulsaría a
  quien tiene sesión guardada.
*/

import { routes } from '@app/routes.js'
import { useAuth } from '@features/auth/auth-context.js'
import { Navigate, useLocation } from 'react-router'

export function RequireAuth({ children }) {
  const { isAuthenticated, status } = useAuth()
  const location = useLocation()

  if (status === 'hydrating') return null

  if (!isAuthenticated) {
    const returnTo = location.pathname + location.search
    return (
      <Navigate to={`${routes.login}?returnTo=${encodeURIComponent(returnTo)}`} replace />
    )
  }

  return children
}
