import { adminSalesService } from '@api/services/admin-sales-service.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  Panel de ventas sobre el router y los providers reales:
  el admin ve el listado, entra al detalle y mueve la venta de estado con la
  confirmación de por medio. El idioma se fija en español.
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

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('admin sales — listado', () => {
  it('muestra las ventas con su estado, canal y antigüedad', async () => {
    await signInAs(SeedUser.Admin)

    renderAt(routes.adminSales)

    expect(await screen.findByRole('heading', { name: 'Ventas' })).toBeInTheDocument()
    expect(await screen.findByText('5 ventas')).toBeInTheDocument()

    // La venta 2 (Contactada, 4 días) es la única que pasó el umbral: su
    // antigüedad se resalta como insignia.
    expect(screen.getByText('4 d')).toBeInTheDocument()

    // Están las cinco, de la más antigua a la más nueva.
    for (const id of [1, 2, 3, 4, 5]) {
      expect(screen.getByText(`#${id}`)).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button', { name: 'Ver' }).length).toBe(5)
  })

  it('filtra por pestaña de estado y por canal', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)

    renderAt(routes.adminSales)
    await screen.findByText('5 ventas')

    await user.click(screen.getByRole('tab', { name: 'Cancelada' }))
    expect(await screen.findByText('1 venta')).toBeInTheDocument()
    expect(screen.getByText('#4')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Todas' }))
    expect(await screen.findByText('5 ventas')).toBeInTheDocument()

    // Por canal: tres ventas son de WhatsApp.
    await user.click(screen.getByRole('radio', { name: 'WhatsApp' }))
    expect(await screen.findByText('3 ventas')).toBeInTheDocument()
  })
})

describe('admin sales — detalle y acciones', () => {
  it('confirma una venta contactada después de pedir confirmación', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)

    renderAt(routes.adminSale(2))

    expect(await screen.findByRole('heading', { name: 'Compra #2' })).toBeInTheDocument()
    expect(screen.getByText('Contactado')).toBeInTheDocument()
    // La reserva lleva 4 días sin respuesta: el detalle lo advierte.
    expect(screen.getByText('Sin respuesta')).toBeInTheDocument()
    // El cliente y su teléfono están a la vista para coordinar.
    expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument()
    expect(screen.getByText(/\+59899000002/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }))

    // La acción irreversible pide confirmación explícita.
    expect(
      await screen.findByText(
        'Confirmar la compra #2 descuenta el stock físico y no se puede deshacer.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sí, continuar' }))

    expect(await screen.findByText('Confirmada')).toBeInTheDocument()
    expect(
      screen.getByText('Esta venta no tiene acciones pendientes.'),
    ).toBeInTheDocument()

    // Efecto en el contrato: la venta quedó confirmada y sellada.
    const sale = await adminSalesService.get(2)
    expect(sale).toMatchObject({ status: 'Confirmed', allowedTransitions: [] })
    expect(sale.confirmedAt).toBeTruthy()
  })

  it('cancela una venta pendiente sin tocar el stock', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)

    renderAt(routes.adminSale(1))
    await screen.findByRole('heading', { name: 'Compra #1' })

    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }))
    expect(
      await screen.findByText(
        'Cancelar la compra #1 libera la reserva de inmediato y no toca el stock.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sí, continuar' }))

    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    const sale = await adminSalesService.get(1)
    expect(sale.status).toBe('Cancelled')
  })

  it('deja cerrar la confirmación sin cambiar nada', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)

    renderAt(routes.adminSale(1))
    await screen.findByRole('heading', { name: 'Compra #1' })

    await user.click(screen.getByRole('button', { name: 'Marcar contactada' }))
    const modal = await screen.findByRole('dialog')
    await user.click(within(modal).getByRole('button', { name: 'Cancelar' }))

    expect(
      screen.queryByText(/¿Marcar la compra #1 como contactada/),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Pendiente de coordinación')).toBeInTheDocument()

    const sale = await adminSalesService.get(1)
    expect(sale.status).toBe('PendingCoordination')
  })
})
