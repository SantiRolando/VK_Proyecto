// Estado de sesión a nivel React (R-15 del plan): usuario, token y rol.
// La persistencia vive en `api/client/session.js`; el `api-client` registra
// acá el handler que limpia la sesión ante un 401 (código UNAUTHENTICATED).

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearSession,
  getSession,
  setOnUnauthorized,
  setSession,
} from '../../api/client/session.js'
import { authService } from '../../api/services/auth-service.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = getSession()
    return {
      user: stored?.user ?? null,
      token: stored?.token ?? null,
      status: 'hydrating',
    }
  })

  const applySession = useCallback((token, user) => {
    if (token && user) setSession(token, user)
    else clearSession()
    setState({ user, token, status: 'ready' })
  }, [])

  useEffect(() => {
    let active = true

    setOnUnauthorized(() => applySession(null, null))

    async function hydrate() {
      const { token } = getSession() ?? {}
      if (!token) {
        if (active) setState((current) => ({ ...current, status: 'ready' }))
        return
      }
      try {
        // Valida el token contra la DB mock (si se reseteó, queda inválido).
        const user = await authService.me()
        if (active) applySession(token, user)
      } catch {
        if (active) applySession(null, null)
      }
    }

    hydrate()
    return () => {
      active = false
    }
  }, [applySession])

  const login = useCallback(
    async (email, password) => {
      const { user, token } = await authService.login({ email, password })
      applySession(token, user)
      return user
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      const { user, token } = await authService.register(payload)
      applySession(token, user)
      return user
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // logout best-effort: se limpia la sesión local igual.
    }
    applySession(null, null)
  }, [applySession])

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      status: state.status,
      isAuthenticated: Boolean(state.user),
      isAdmin: state.user?.type === 'Admin',
      login,
      register,
      logout,
    }),
    [state, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
