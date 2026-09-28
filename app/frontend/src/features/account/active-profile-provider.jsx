// Selector global de perfil activo (US5, R-15). Por ahora solo persiste el
// id seleccionado; el vínculo con la API de perfiles llega en US5.

import { ActiveProfileContext } from '@features/account/active-profile-context.js'
import { useCallback, useMemo, useState } from 'react'

const STORAGE_KEY = 'vkfit.activeProfile'

function readStoredProfileId() {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function ActiveProfileProvider({ children }) {
  const [profileId, setProfileIdState] = useState(readStoredProfileId)

  const setProfileId = useCallback((id) => {
    setProfileIdState(id ?? null)
    try {
      if (id == null) window.localStorage.removeItem(STORAGE_KEY)
      else window.localStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      // ignorar
    }
  }, [])

  const value = useMemo(() => ({ profileId, setProfileId }), [profileId, setProfileId])

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  )
}
