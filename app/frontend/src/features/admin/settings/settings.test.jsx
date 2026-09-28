import { setSession } from '@api/client/session.js'
import { adminSettingsService } from '@api/services/admin-settings-service.js'
import { devService } from '@api/services/dev-service.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

// Reglas del juego (US11/T098) sobre el router y los providers reales.

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

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await devService.reset()
})

describe('reglas del juego (US11)', () => {
  it('edita la probabilidad de puntos y confirma el guardado', async () => {
    const user = userEvent.setup()
    await signInAs(ADMIN)
    renderAt(routes.adminSettings)

    const probability = await screen.findByLabelText(/Probabilidad de acierto/)
    expect(probability).toHaveValue('30 %')

    await user.clear(probability)
    await user.type(probability, '100')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText('Reglas guardadas. El cliente ya ve los cambios.'),
    ).toBeInTheDocument()

    // Persistió en las reglas del backend.
    const settings = await adminSettingsService.get()
    expect(settings.successProbability).toBe(100)
  })
})
