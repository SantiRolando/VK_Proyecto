import { apiClient } from '@api/client/api-client.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  El catálogo lista productos aunque el cliente todavía no tenga talle: el hook tenía
  `enabled: Boolean(sizeId)`, así que sin talle la consulta quedaba pendiente para
  siempre y la pantalla mostraba esqueletos. El test afirma las tarjetas de producto
  y no la presencia de enlaces: con el catálogo vacío, los de la navegación
  alcanzaban para pasarlo.
*/
describe('catálogo sin talle', () => {
  beforeEach(async () => {
    window.localStorage.setItem('vkfit.language', 'es')
    queryClient.clear()
    await testTools.resetDatabase()
    await signInAs(SeedUser.Ana)
  })

  const renderAt = (path) =>
    render(
      <Providers>
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>
      </Providers>,
    )

  const main = async () => within(await screen.findByRole('main'))

  it('sin sizeId lista productos y muestra el aviso', async () => {
    // Modelos reales de la seed, para no afirmar sobre texto inventado.
    const catalog = await apiClient.get('/catalog')
    expect(catalog.length).toBeGreaterThan(0)
    const expected = catalog.slice(0, 2).map((product) => product.model)

    renderAt(routes.catalog())
    const view = await main()

    expect(await view.findByText('Mejor con tu talle')).toBeInTheDocument()

    // Lo que importa: las tarjetas se renderizan.
    await waitFor(() => {
      expect(view.getAllByRole('button', { name: 'Ver' }).length).toBeGreaterThan(0)
    })
    for (const model of expected) {
      expect(view.getByText(model)).toBeInTheDocument()
    }

    // Sin talle consultado no se afirma disponibilidad: es desconocida, no cero.
    expect(view.getAllByText('Elegí un talle para ver disponibilidad').length).toBe(
      catalog.length,
    )
    expect(view.queryByText(/unidades disponibles/)).not.toBeInTheDocument()
  })

  it('el estado viejo de bloqueo ya no existe', async () => {
    renderAt(routes.catalog())
    const view = await main()

    await view.findByText('Mejor con tu talle')
    expect(view.queryByText('Primero necesitamos tu talle')).not.toBeInTheDocument()
  })

  it('con un sizeId válido filtra y no muestra el aviso', async () => {
    const size = await apiClient.get('/public/sizes').then((data) => data[0])
    renderAt(`${routes.catalog()}?sizeId=${size.id}`)

    const view = await main()

    /*
      Se espera a que el encabezado refleje el talle: así el assert negativo ocurre
      después de que la pantalla resolvió.
    */
    await waitFor(() => {
      expect(view.getByText(`Talle: ${size.code}`)).toBeInTheDocument()
    })

    expect(view.queryByText('Mejor con tu talle')).not.toBeInTheDocument()
    // Con talle sí se informa la disponibilidad.
    await waitFor(() => {
      expect(view.getAllByText(/unidades disponibles/).length).toBeGreaterThan(0)
    })
  })
})
