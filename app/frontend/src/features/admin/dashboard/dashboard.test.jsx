import { setSession } from '@api/client/session.js'
import { adminAnalyticsService } from '@api/services/admin-analytics-service.js'
import { devService } from '@api/services/dev-service.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Dashboard de US8 sobre el router y los providers reales: los cuatro bloques
// con datos de la seed y el filtro de fechas. Los números están acotados por la
// seed (ver `mocks/db/seed/history.js`).

const ADMIN = 1

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

async function signInAs(userId) {
  const { user, token } = await devService.loginAs(userId)
  setSession(token, user)
}

const isoDaysAgo = (days) =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await devService.reset()
})

describe('dashboard (US8)', () => {
  it('muestra los cuatro bloques con datos de la seed', async () => {
    await signInAs(ADMIN)
    renderAt(routes.admin)

    // Los cuatro bloques.
    expect(await screen.findByText('Conversión')).toBeInTheDocument()
    expect(screen.getByText('Precisión del talle')).toBeInTheDocument()
    expect(screen.getByText('Stock crítico')).toBeInTheDocument()
    expect(screen.getByText('Ventas en vuelo')).toBeInTheDocument()

    // Precisión: las generaciones 101 y 102 tienen venta y feedback "Correcto".
    expect(await screen.findByText('2 de 2 dijeron “Correcto”')).toBeInTheDocument()
    expect(screen.getByText('Solo consultaron')).toBeInTheDocument()

    // Stock crítico: al menos una variante por debajo del mínimo.
    expect(screen.getAllByText(/de \d+ mín\./).length).toBeGreaterThan(0)

    // Ventas en vuelo: solo las abiertas (#1, #2, #5), con teléfono y canal.
    expect(await screen.findByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#5')).toBeInTheDocument()
    expect(screen.queryByText('#3')).not.toBeInTheDocument()
    expect(screen.getAllByText(/\+59899000002/).length).toBeGreaterThan(0)
  })

  it('respeta el filtro de fechas', async () => {
    const conversion = vi.spyOn(adminAnalyticsService, 'conversion')
    const user = userEvent.setup()
    await signInAs(ADMIN)
    renderAt(routes.admin)

    // Por defecto pide los últimos 30 días.
    await waitFor(() => expect(conversion).toHaveBeenCalledWith({ from: isoDaysAgo(30) }))

    await user.click(screen.getByRole('radio', { name: '7 días' }))
    await waitFor(() => expect(conversion).toHaveBeenCalledWith({ from: isoDaysAgo(7) }))

    await user.click(screen.getByRole('radio', { name: 'Todo' }))
    await waitFor(() => expect(conversion).toHaveBeenCalledWith({}))
  })
})
