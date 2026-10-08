import { rewardsService } from '@api/services/rewards-service.js'
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
  Cupones del panel sobre el router y los providers reales. El
  efecto en el cliente se comprueba contra `GET /rewards`.
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

describe('cupones', () => {
  it('lista plantillas y cupones asignados', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    expect(await screen.findByText('VIKI10')).toBeInTheDocument()
    expect(screen.getByText('ANA15')).toBeInTheDocument()
    // VIKI10 y ENVIO5 son canjeables; VIP5000 está inactivo.
    expect(screen.getAllByText('Canjeable').length).toBe(2)
    expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument()
    // ANA15 no declara costo de canje: la celda va con guion y sin em-dash en la pantalla.
    const row = screen.getByText('ANA15').closest('tr')
    expect(within(row).getByText('-')).toBeInTheDocument()
    expect(screen.queryByText('—')).toBeNull()
    // Los usos muestran el tope cuando la plantilla lo declara, y el singular concuerda.
    expect(screen.getByText('12 de 200 usos')).toBeInTheDocument()
    expect(screen.getByText('4 usos')).toBeInTheDocument()
    expect(screen.getByText('1 uso')).toBeInTheDocument()
    // El tope de los porcentuales se ve en la lista; en los de monto fijo ya está aplicado.
    expect(screen.getAllByText(/^Tope de /)).toHaveLength(3)
  })

  it('editar el costo de canje se refleja en el catálogo de recompensas', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    const row = (await screen.findByText('ENVIO5')).closest('tr')
    await user.click(within(row).getByRole('button', { name: 'Editar cupón ENVIO5' }))

    const modal = await screen.findByRole('dialog', { name: 'Editar cupón' })
    const cost = within(modal).getByLabelText(/Costo en puntos/)
    await user.clear(cost)
    await user.type(cost, '20')
    await user.click(within(modal).getByRole('button', { name: 'Guardar' }))

    // El cliente ve el nuevo costo (lo que pide `GET /rewards`).
    await waitFor(async () => {
      const templates = await rewardsService.listTemplates()
      expect(templates.find((item) => item.code === 'ENVIO5').pointsCost).toBe(20)
    })
  })

  it('la edición abre con el código del cupón cargado', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    const row = (await screen.findByText('ENVIO5')).closest('tr')
    await user.click(within(row).getByRole('button', { name: 'Editar cupón ENVIO5' }))

    const modal = await screen.findByRole('dialog', { name: 'Editar cupón' })
    expect(within(modal).getByRole('textbox', { name: /Código/ })).toHaveValue('ENVIO5')
  })

  it('el aviso de puntos lleva a configuración en un clic', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    expect(await screen.findByText('Puntos y cupones')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a Configuración' })).toHaveAttribute(
      'href',
      routes.adminSettings,
    )
  })

  it('el alta de un cupón se confirma con Crear', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    await user.click(await screen.findByRole('button', { name: 'Nuevo cupón' }))

    const modal = await screen.findByRole('dialog', { name: 'Nuevo cupón' })
    expect(within(modal).getByRole('button', { name: 'Crear' })).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(within(modal).queryByRole('button', { name: 'Guardar' })).toBeNull()
  })

  it('el formulario rechaza el código repetido y las fechas vacías sin llamar al endpoint', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    await user.click(await screen.findByRole('button', { name: 'Nuevo cupón' }))
    const modal = await screen.findByRole('dialog', { name: 'Nuevo cupón' })

    // VIKI10 ya existe: el mensaje propio de la regla solo lo puede dar el formulario.
    await user.type(within(modal).getByRole('textbox', { name: /Código/ }), 'VIKI10')
    await user.click(within(modal).getByRole('button', { name: 'Crear' }))

    expect(
      await within(modal).findByText('Ya existe un cupón con ese código.'),
    ).toBeInTheDocument()
    // Las dos fechas son obligatorias y quedaron vacías.
    expect(within(modal).getAllByText('Campo obligatorio')).toHaveLength(2)
    expect(screen.getByRole('dialog', { name: 'Nuevo cupón' })).toBeInTheDocument()
  })

  it('el cupón nuevo nace activo, se puede desactivar y usa el calendario de Mantine', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    await user.click(await screen.findByRole('button', { name: 'Nuevo cupón' }))
    const modal = await screen.findByRole('dialog', { name: 'Nuevo cupón' })

    const activo = within(modal).getByRole('switch', { name: 'Activo' })
    expect(activo).toBeChecked()
    await user.click(activo)
    expect(activo).not.toBeChecked()

    // Las fechas dejaron el `input type="date"` del navegador por el `DateInput` de Mantine.
    expect(modal.querySelectorAll('input[type="date"]')).toHaveLength(0)
    expect(within(modal).getByLabelText(/^Desde/)).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^Hasta/)).toBeInTheDocument()
  })

  it('en el teléfono cada cupón es una card y no hay tabla', async () => {
    useSmallScreen()
    await signInAs(SeedUser.Admin)
    const { container } = renderAt(routes.adminCoupons)

    expect(await screen.findByText('VIKI10')).toBeInTheDocument()
    expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).toBeNull()
    expect(screen.getAllByRole('button', { name: /^Editar cupón/ })).toHaveLength(5)
    /*
      Cada card es una `SurfaceCard`: los cinco cupones de la seed, más la del aviso de
      puntos. Se mira el token de la superficie porque la card no deja otra marca.
    */
    expect(container.querySelectorAll('[style*="--vk-surface-background"]')).toHaveLength(
      6,
    )
  })
})
