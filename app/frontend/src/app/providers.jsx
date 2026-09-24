// Providers de la app (T014 del plan): tema Mantine, i18n, TanStack Query,
// sesión y perfil activo. El router y Lenis viven en `main.jsx`.

import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '../i18n/i18n-provider.jsx'
import { AuthProvider } from '../features/auth/auth-provider.jsx'
import { ActiveProfileProvider } from '../features/account/active-profile-provider.jsx'
import { theme } from '../theme/theme.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

export function Providers({ children }) {
  return (
    <MantineProvider theme={theme}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ActiveProfileProvider>{children}</ActiveProfileProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </MantineProvider>
  )
}
