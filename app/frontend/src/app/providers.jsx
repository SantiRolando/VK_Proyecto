// Providers de la app (T014 del plan): tema Mantine, i18n, TanStack Query,
// sesión y perfil activo. El router y Lenis viven en `main.jsx`.

import { queryClient } from '@app/query-client.js'
import { ActiveProfileProvider } from '@features/account/active-profile-provider.jsx'
import { AuthProvider } from '@features/auth/auth-provider.jsx'
import { I18nProvider } from '@i18n/i18n-provider.jsx'
import { MantineProvider } from '@mantine/core'
import { QueryClientProvider } from '@tanstack/react-query'
import { theme } from '@theme/theme.js'

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
