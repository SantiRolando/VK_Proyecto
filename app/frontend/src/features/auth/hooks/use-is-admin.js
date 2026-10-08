import { useAuth } from '@features/auth/auth-context.js'
import { isAdmin } from '@features/auth/permissions.js'

// Permiso de panel para el usuario de la sesión, sin repetir la comparación del rol.
export function useIsAdmin() {
  const { user } = useAuth()
  return isAdmin(user)
}
