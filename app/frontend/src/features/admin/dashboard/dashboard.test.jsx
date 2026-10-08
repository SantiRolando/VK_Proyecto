import { adminAnalyticsService } from '@api/services/admin-analytics-service.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
  Dashboard del panel sobre el router y los providers reales: los cuatro bloques
  con datos de la seed y el rango de fechas por defecto. El filtro se elige con
  `DatePickerInput` de `@mantine/dates` (popover difícil de manejar en jsdom):
  su efecto sobre los datos está cubierto por los tests de contrato
  (`date-range` + `admin-analytics`).
*/

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

const isoDaysAgo = (days) =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('dashboard', () => {
  it('muestra los cuatro bloques con datos de la seed', async () => {
    await signInAs(SeedUser.Admin)
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

  it('pide los KPIs con el rango de fechas por defecto', async () => {
    const conversion = vi.spyOn(adminAnalyticsService, 'conversion')
    await signInAs(SeedUser.Admin)
    renderAt(routes.admin)

    // El filtro está en pantalla y arranca en los últimos 30 días.
    expect(await screen.findByLabelText('Rango de fechas')).toBeInTheDocument()

    await waitFor(() =>
      expect(conversion).toHaveBeenCalledWith({
        from: isoDaysAgo(30),
        to: isoDaysAgo(0),
      }),
    )
  })
})
