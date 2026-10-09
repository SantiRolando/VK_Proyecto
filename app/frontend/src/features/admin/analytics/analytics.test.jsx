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

/*
  Analíticas del panel sobre el router y los providers reales: los indicadores, la demanda
  insatisfecha y los comentarios del feedback conviven en la misma pantalla.
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

async function section(name) {
  return within(await screen.findByRole('region', { name }))
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('analíticas', () => {
  it('reúne los indicadores, la demanda insatisfecha y los comentarios', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.admin)

    expect(await screen.findByRole('heading', { name: 'Analíticas' })).toBeInTheDocument()

    const indicators = await section('Indicadores')
    for (const title of [
      'Conversión',
      'Precisión del talle',
      'Stock crítico',
      'Ventas en vuelo',
    ]) {
      expect(indicators.getByText(title)).toBeInTheDocument()
    }
    expect(indicators.getByLabelText('Rango de fechas')).toBeInTheDocument()

    const missing = await section('Talles faltantes')
    expect(await missing.findByText(/\d+ consultas sin stock/)).toBeInTheDocument()
    // Endurance talle M no tiene stock en la seed: su línea aparece en el mapa.
    expect(missing.getByText('Endurance')).toBeInTheDocument()
    expect(missing.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
    expect(missing.getByRole('button', { name: 'Excel' })).toBeEnabled()

    const comments = await section('Comentarios')
    expect(await comments.findByText(/Perfecto en la cadera/)).toBeInTheDocument()
    expect(comments.getByText(/\d+ comentarios/)).toBeInTheDocument()
    expect(comments.getByRole('button', { name: 'Excel' })).toBeEnabled()
  })

  it('las rutas viejas de los reportes caen en la pantalla unificada', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminComments)

    expect(await screen.findByRole('heading', { name: 'Analíticas' })).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Comentarios' })).toBeInTheDocument()
  })
})
