import { setSession } from '@api/client/session.js'
import { adminAnalyticsService } from '@api/services/admin-analytics-service.js'
import { devService } from '@api/services/dev-service.js'
import { sizeService } from '@api/services/size-service.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

// Modo asistente (US12/T100) sobre el router y los providers reales: la
// medición cuenta en las métricas globales pero no en el historial personal del
// admin, y no ofrece las tarjetas personales.

const ADMIN = 1

const MEASURES = [
  ['Altura', '168'],
  ['Busto', '85'],
  ['Cintura', '67'],
  ['Cadera', '94'],
  ['Torso', '141'],
]

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

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await devService.reset()
})

describe('modo asistente (US12)', () => {
  it('mide para un tercero sin entrar en el historial personal del admin', async () => {
    const user = userEvent.setup()
    await signInAs(ADMIN)
    const before = await adminAnalyticsService.conversion({})

    // La línea llega preseleccionada por query (igual que `/fit`).
    renderAt(`${routes.adminAssistant}?line=endurance`)

    // El switch "Para terceros" arranca activo.
    expect(await screen.findByRole('switch', { name: 'Para terceros' })).toBeChecked()

    for (const [label, value] of MEASURES) {
      const input = screen.getByLabelText(new RegExp(label))
      await user.clear(input)
      await user.type(input, value)
    }
    await user.click(screen.getByRole('button', { name: 'Obtener mi talle' }))

    // Resultado sin tarjetas personales (guardar perfil / calificar).
    expect(await screen.findByText('Tu talle recomendado')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('Guardar como perfil')).not.toBeInTheDocument(),
    )
    expect(screen.queryByText('Calificá tu talle')).not.toBeInTheDocument()

    // Cuenta en las métricas globales y queda fuera del historial personal.
    const after = await adminAnalyticsService.conversion({})
    expect(after.generations).toBe(before.generations + 1)
    expect(await sizeService.listGenerations()).toHaveLength(0)
  })
})
