import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

// Reportes de US10 sobre el router y los providers reales: demanda no
// satisfecha y comentarios del feedback.

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

async function mainView() {
  return within(await screen.findByRole('main'))
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('demanda no satisfecha (US10)', () => {
  it('dibuja el mapa por línea × talle y ofrece exportar', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminMissingSizes)
    const view = await mainView()

    expect(await view.findByText(/\d+ consultas sin stock/)).toBeInTheDocument()
    // Endurance talle M no tiene stock en la seed: su línea aparece en el mapa.
    expect(view.getByText('Endurance')).toBeInTheDocument()

    expect(view.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
    expect(view.getByRole('button', { name: 'Excel' })).toBeEnabled()
  })
})

describe('comentarios (US10)', () => {
  it('lista los comentarios del feedback con su calificación', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminComments)
    const view = await mainView()

    expect(await view.findByText(/Perfecto en la cadera/)).toBeInTheDocument()
    expect(view.getByText(/\d+ comentarios/)).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Excel' })).toBeEnabled()
  })
})
