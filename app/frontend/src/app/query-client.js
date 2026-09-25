// Instancia única de caché de TanStack Query. Vive en su propio módulo para
// que `providers.jsx` solo exporte componentes (regla de fast refresh) y para
// que los tests de componentes puedan limpiar la caché entre casos.

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})
