import { adminSettingsService } from '@api/services/admin-settings-service.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

// Reglas del juego sobre el router y los providers reales.

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('reglas del juego', () => {
  it('edita la probabilidad de puntos y confirma el guardado', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    const probability = await screen.findByRole('textbox', {
      name: 'Probabilidad de acierto',
    })
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

  it('mueve el valor con los botones, en el paso del campo', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    const probability = await screen.findByRole('textbox', {
      name: 'Probabilidad de acierto',
    })

    await user.click(
      screen.getByRole('button', { name: 'Aumentar: Probabilidad de acierto' }),
    )

    expect(probability).toHaveValue('35 %')
  })

  it('muestra la lectura de la configuración y la recalcula al editarla', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    // Seed: 30 % de acierto, 10 puntos por premio y tope de 5 sobre 10 feedbacks.
    expect(
      await screen.findByText(
        'Si un cliente deja 10 feedbacks el mismo día, tiene un 97.2 % de recibir puntos y suma unos 29 puntos.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Equilibrada')).toBeInTheDocument()

    // Sin sorteo no hay recompensa: la badge y la frase siguen el valor nuevo.
    const probability = screen.getByRole('textbox', {
      name: 'Probabilidad de acierto',
    })
    await user.clear(probability)
    await user.type(probability, '0')

    expect(await screen.findByText('Sin recompensa')).toBeInTheDocument()
  })

  it('cada ajuste numérico explica qué modifica', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    expect(
      await screen.findByText(
        '¿Qué chance tiene el usuario de recibir puntos al dar feedback?',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Puntos que suma cada feedback premiado.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Feedbacks premiados por cliente y por día.'),
    ).toBeInTheDocument()
  })
})
