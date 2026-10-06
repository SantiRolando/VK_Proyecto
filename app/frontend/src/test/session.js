/*
    Sesión de los tests: entra por el login real, el mismo camino que usa la app,
    con las tres cuentas fijas de la seed (`mocks/db/seed/users.js`), que están
    documentadas y son estables.
*/
import { setSession } from '@api/client/session.js'
import { authService } from '@api/services/auth-service.js'
import { SeedUser } from '@constants/enums.js'

const CREDENTIALS = {
  [SeedUser.Admin]: { email: 'admin@vikinga.test', password: 'admin123' },
  [SeedUser.Ana]: { email: 'ana@example.test', password: 'cliente123' },
  [SeedUser.EmptyCustomer]: { email: 'nuevo@example.test', password: 'cliente123' },
}

export async function signInAs(userId = SeedUser.Ana) {
  const credentials = CREDENTIALS[userId]
  if (!credentials) {
    throw new Error(`signInAs: no hay credenciales para el usuario ${userId}`)
  }

  const { user, token, refreshToken, expiresInSeconds } =
    await authService.login(credentials)
  setSession(token, user, refreshToken, expiresInSeconds)

  return user
}
