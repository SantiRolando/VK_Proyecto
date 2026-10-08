/*
  Estado de sesión a nivel React: usuario, tokens y rol. La persistencia vive en
  `api/client/session.js`; acá se registra el handler que limpia la sesión cuando la renovación
  del token ya no es posible.
*/

import {
  clearSession,
  getSession,
  resetGuestSessionId,
  setOnUnauthorized,
  setSession,
  setSessionUser,
} from '@api/client/session.js'
import { authService } from '@api/services/auth-service.js'
import { queryClient } from '@app/query-client.js'
import { AuthContext } from '@features/auth/auth-context.js'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = getSession()
    return {
      user: stored?.user ?? null,
      token: stored?.token ?? null,
      status: 'hydrating',
    }
  })

  // Adopta una sesión `{ user, token, refreshToken, expiresInSeconds }` (login,
  // registro, OTP) o la cierra con `null`. Al entrar o salir se rota el id de
  // invitado y se vacía la caché de datos: lo que sigue es de otra persona.
  const applySession = useCallback((auth) => {
    if (auth?.token && auth?.user) {
      const current = getSession()
      setSession(
        auth.token,
        auth.user,
        auth.refreshToken ?? current?.refreshToken,
        auth.expiresInSeconds ?? null,
      )
      if (!current?.user || current.user.id !== auth.user.id) {
        resetGuestSessionId()
        queryClient.clear()
      }
      setState({ user: auth.user, token: auth.token, status: 'ready' })
    } else {
      clearSession()
      resetGuestSessionId()
      queryClient.clear()
      setState({ user: null, token: null, status: 'ready' })
    }
  }, [])

  useEffect(() => {
    let active = true

    setOnUnauthorized(() => applySession(null))

    async function hydrate() {
      const { token } = getSession() ?? {}
      if (!token) {
        if (active) setState((current) => ({ ...current, status: 'ready' }))
        return
      }
      try {
        // Valida el token contra la API (si venció, el api-client lo renueva).
        const user = await authService.me()
        const session = getSession()
        if (active) {
          setSessionUser(user)
          setState({ user, token: session?.token ?? token, status: 'ready' })
        }
      } catch {
        if (active) applySession(null)
      }
    }

    hydrate()
    return () => {
      active = false
    }
  }, [applySession])

  const login = useCallback(
    async (email, password) => {
      const auth = await authService.login({ email, password })
      applySession(auth)
      return auth.user
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      const auth = await authService.register(payload)
      applySession(auth)
      return auth.user
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    const refreshToken = getSession()?.refreshToken
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } catch {
      // logout best-effort: se limpia la sesión local igual.
    }
    applySession(null)
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
      adoptSession: applySession,
    }),
    [state, login, register, logout, applySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
