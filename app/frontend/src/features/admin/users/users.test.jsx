import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/*
  Cuentas del panel sobre el router y los providers reales. La seed trae 36 cuentas: 33
  clientes y 3 administradores.
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

// `useMediaQuery` lee `window.matchMedia`, que el setup deja sin coincidencias: la pantalla
// chica se simula acá.
const desktopMatchMedia = window.matchMedia

function useSmallScreen() {
  window.matchMedia = (query) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

afterEach(() => {
  window.matchMedia = desktopMatchMedia
})

describe('cuentas y roles', () => {
  it('lista el directorio completo con sus indicadores', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminUsers)

    expect(await screen.findByText('nuevo@example.test')).toBeInTheDocument()
    // Las 36 cuentas de la seed, más el encabezado de la tabla.
    expect(screen.getAllByRole('row')).toHaveLength(37)
    expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument()
    expect(screen.getByText('Mostrador Vikinga')).toBeInTheDocument()
    expect(screen.getAllByText('Administrador')).toHaveLength(3)
    expect(screen.getAllByText('Cliente')).toHaveLength(33)
    expect(screen.getByText('Mostrando 36 de 36 cuentas.')).toBeInTheDocument()
    // Los indicadores cuadran con el directorio.
    expect(screen.getByText('3 admin · 33 clientes')).toBeInTheDocument()
  })

  it('filtra por rol desde el segmentado', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminUsers)

    await screen.findByText('nuevo@example.test')
    await user.click(screen.getByRole('radio', { name: 'Admins' }))

    // Cambiar el filtro refetchea el directorio: con la suite entera corriendo, 1s no alcanza.
    await waitFor(
      () => {
        expect(screen.queryByText('nuevo@example.test')).toBeNull()
      },
      { timeout: 5000 },
    )
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.getByText('Mostrando 3 de 36 cuentas.')).toBeInTheDocument()
  })

  it('el filtro de actividad deja solo cuentas con uso', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminUsers)

    await screen.findByText('nuevo@example.test')
    expect(screen.queryAllByText('Sin actividad').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('radio', { name: 'Con actividad' }))

    await waitFor(
      () => {
        expect(screen.queryAllByText('Sin actividad')).toHaveLength(0)
      },
      { timeout: 5000 },
    )
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('el admin no puede quitarse su propio acceso', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminUsers)

    // La barra lateral también muestra el nombre del admin: la fila se busca dentro de la tabla.
    const table = await screen.findByRole('table')
    const row = within(table).getByText('Vikinga Admin').closest('tr')
    const button = within(row).getByRole('button', { name: 'Quitar admin' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', 'No podés quitarte tu propio acceso.')
  })

  it('otorga admin sin recargar la lista', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminUsers)

    const table = await screen.findByRole('table')
    const row = within(table).getByText('Ana Rodríguez').closest('tr')
    await user.click(within(row).getByRole('button', { name: 'Dar admin' }))

    await waitFor(
      () => {
        expect(within(table).getByText('Ana Rodríguez').closest('tr')).toHaveTextContent(
          'Administrador',
        )
      },
      { timeout: 5000 },
    )
    expect(screen.getByText('4 admin · 32 clientes')).toBeInTheDocument()
  })

  it('en el teléfono cada cuenta es una card y no hay tabla', async () => {
    useSmallScreen()
    await signInAs(SeedUser.Admin)
    const { container } = renderAt(routes.adminUsers)

    expect(await screen.findByText('nuevo@example.test')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).toBeNull()
    expect(screen.getAllByRole('button', { name: /^(Dar|Quitar) admin$/ })).toHaveLength(
      36,
    )
    /*
      Cada cuenta es una `SurfaceCard`, y las secciones también: los cuatro indicadores, el
      gráfico y la lista. Se mira el token de la superficie porque la card no deja otra marca.
    */
    expect(container.querySelectorAll('[style*="--vk-surface-background"]')).toHaveLength(
      42,
    )
  })
})
