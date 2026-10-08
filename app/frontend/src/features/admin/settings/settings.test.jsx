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

// Configuración sobre el router y los providers reales.

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

describe('configuración', () => {
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

    expect(await screen.findByText('Configuración guardada.')).toBeInTheDocument()

    // Persistió en la configuración del backend.
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

  it('muestra la lectura de la configuración con los números en su lugar', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    // Seed: 30 % de acierto, 10 puntos por premio y tope de 5, sobre tres feedbacks.
    const phrase = await screen.findByText(/Si un cliente deja/)
    expect(phrase.textContent).toBe(
      'Si un cliente deja 3 feedbacks el mismo día, tiene un 65,7 % de recibir puntos y suma unos 9 puntos.',
    )
    // Un tramo dinámico por número: es lo que permite marcarlos con negrita y color.
    expect(phrase.querySelectorAll('span')).toHaveLength(3)

    // La badge del encabezado y la marca de la barra dicen lo mismo, a propósito.
    expect(screen.getAllByText('Equilibrada')).toHaveLength(2)
  })

  it('la barra ofrece los tres puntos de partida', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    expect(
      await screen.findByRole('slider', { name: 'Punto de partida' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ajustada')).toBeInTheDocument()
    expect(screen.getByText('Generosa')).toBeInTheDocument()
  })

  it('sin sorteo no hay recompensa', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSettings)

    const probability = await screen.findByRole('textbox', {
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
