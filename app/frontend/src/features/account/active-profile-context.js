import { createContext, useContext } from 'react'

export const ActiveProfileContext = createContext(null)

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext)
  if (!context) {
    throw new Error('useActiveProfile must be used within ActiveProfileProvider')
  }
  return context
}
