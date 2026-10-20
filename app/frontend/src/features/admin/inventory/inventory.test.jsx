import { adminInventoryService } from '@api/services/admin-inventory-service.js'
import { adminStockAlertsService } from '@api/services/admin-stock-alerts-service.js'
import { catalogService } from '@api/services/catalog-service.js'
import { sizeService } from '@api/services/size-service.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { ADMIN_INVENTORY_TABS, routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  Inventario, alertas y catálogo sobre el router y los providers reales: ajuste de stock con
  motivo (auditado), alertas de crítico, movimientos y CRUD del catálogo del panel.
*/

// Endurance talle M no tiene stock en ningún color en la seed.
const EMPTY_SKU = 'ENDURANCE-CLASSIC-NAVY-M'

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

// La fila del SKU: en inventario la celda arranca con él; en alertas va con modelo y talle.
async function rowOf(sku) {
  return (await screen.findByText(sku, { exact: false })).closest('tr')
}

async function inventoryRow(sku) {
  const { items } = await adminInventoryService.listInventory({ pageSize: 100 })
  return items.find((item) => item.sku === sku)
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('inventario', () => {
  it('ajusta el stock con motivo y nota, deja el movimiento auditado y el catálogo lo refleja', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminInventory)

    // La variante sin stock arranca en crítico.
    const row = await rowOf(EMPTY_SKU)
    expect(within(row).getByText('Crítico')).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: 'Ajustar stock' }))
    const modal = await screen.findByRole('dialog', { name: 'Ajustar stock' })

    // El motivo es obligatorio; "Ingreso de mercadería" fija la dirección.
    await user.click(
      await within(modal).findByRole('radio', { name: 'Ingreso de mercadería' }),
    )
    expect(within(modal).getByText('Dirección: Entrada')).toBeInTheDocument()

    const quantity = within(modal).getByLabelText(/Cantidad/)
    await user.clear(quantity)
    await user.type(quantity, '4')
    await user.type(within(modal).getByLabelText(/Nota/), 'Recepción de mercadería')
    await user.click(within(modal).getByRole('button', { name: 'Registrar movimiento' }))

    // El inventario refleja el físico nuevo y sale del estado crítico.
    await waitFor(async () => {
      const variant = await inventoryRow(EMPTY_SKU)
      expect(variant).toMatchObject({ quantity: 4, available: 4, isCritical: false })
    })
    await waitFor(async () => {
      const updated = await rowOf(EMPTY_SKU)
      expect(within(updated).queryByText('Crítico')).not.toBeInTheDocument()
    })

    // Quedó el movimiento auditable con su motivo, su nota y sus líneas.
    const movements = await adminInventoryService.listTransactions({})
    expect(movements.items).toHaveLength(5)
    expect(movements.items[0]).toMatchObject({
      reason: 'GoodsReceipt',
      direction: 'Inbound',
      note: 'Recepción de mercadería',
    })
    const detail = await adminInventoryService.getTransaction(movements.items[0].id)
    expect(detail.lines).toHaveLength(1)

    // El catálogo del cliente ya ofrece el talle M de Endurance.
    const size = (await sizeService.getSizes({ line: 'Endurance' })).find(
      (item) => item.code === 'M',
    )
    const catalog = await catalogService.list({ sizeId: size.id })
    expect(catalog.meta.hasStock).toBe(true)
  })

  it('no deja sacar más de lo disponible', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminInventory)

    const row = await rowOf(EMPTY_SKU)
    await user.click(within(row).getByRole('button', { name: 'Ajustar stock' }))
    const modal = await screen.findByRole('dialog', { name: 'Ajustar stock' })

    await user.click(
      await within(modal).findByRole('radio', { name: 'Pérdida / defectuoso' }),
    )
    const quantity = within(modal).getByLabelText(/Cantidad/)
    await user.clear(quantity)
    await user.type(quantity, '1')
    await user.click(within(modal).getByRole('button', { name: 'Registrar movimiento' }))

    // El disponible es 0: la salida se rechaza con el número a la vista.
    expect(
      await within(modal).findByText('No hay disponible suficiente: el disponible es 0.'),
    ).toBeInTheDocument()
    expect(await inventoryRow(EMPTY_SKU)).toMatchObject({ quantity: 0 })
  })

  it('pagina el inventario', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminInventory)

    expect(await screen.findByText(/Mostrando 1–20 de \d+/)).toBeInTheDocument()
    expect(await screen.findByText(EMPTY_SKU)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText(/Mostrando 21–40 de \d+/)).toBeInTheDocument()
  })

  it('filtra por las variantes bajo el mínimo', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminInventory)

    const before = await screen.findByText(/Mostrando 1–20 de \d+/)
    expect(before).toBeInTheDocument()

    await user.click(screen.getByLabelText('Solo bajo mínimo'))
    expect(await screen.findByText(EMPTY_SKU)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(/Mostrando 1–20 de \d+/)).not.toBeInTheDocument(),
    )
  })
})

describe('alertas de stock crítico', () => {
  it('marca una alerta como notificada y la saca de las pendientes', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)

    // La primera alerta de crítico de la seed, con su SKU resuelto contra el inventario.
    const alerts = await adminStockAlertsService.list({ status: 'Active' })
    const target = alerts.items.find((alert) => alert.alertType === 'CriticalStock')
    const { items } = await adminInventoryService.listInventory({
      onlyBelowMin: true,
      pageSize: 100,
    })
    const sku = items.find((item) => item.id === target.variantId).sku

    renderAt(routes.adminInventoryTab(ADMIN_INVENTORY_TABS.alerts))

    const row = await rowOf(sku)
    expect(within(row).getByText('Activa')).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: 'Marcar notificada' }))

    await waitFor(() =>
      expect(screen.queryByText(sku, { exact: false })).not.toBeInTheDocument(),
    )

    // La alerta quedó notificada del lado del endpoint.
    const notified = await adminStockAlertsService.list({ status: 'Notified' })
    expect(notified.items).toContainEqual(
      expect.objectContaining({
        id: target.id,
        status: 'Notified',
        notifiedAt: expect.any(String),
      }),
    )
  })

  it('no cuenta los avisos de reposición del cliente', async () => {
    await signInAs(SeedUser.Admin)

    const alerts = await adminStockAlertsService.list({ status: 'Active' })
    const critical = alerts.items.filter((alert) => alert.alertType === 'CriticalStock')
    expect(critical.length).toBeLessThan(alerts.items.length)

    renderAt(routes.adminInventoryTab(ADMIN_INVENTORY_TABS.alerts))

    expect(await screen.findByText(`${critical.length} alertas`)).toBeInTheDocument()
  })
})

describe('movimientos', () => {
  it('lista la auditoría y abre el detalle con sus líneas', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminSales)

    expect(await screen.findByText('Movimientos de stock')).toBeInTheDocument()
    expect((await screen.findAllByText('Entrada')).length).toBeGreaterThan(0)
    expect(screen.getByText('4 movimientos')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])

    const detail = await screen.findByRole('dialog', { name: 'Detalle del movimiento' })
    expect(within(detail).getByText('Usuario #1')).toBeInTheDocument()
    expect(within(detail).getByText('Cantidad')).toBeInTheDocument()
  })

  it('la ruta vieja de movimientos cae en la pantalla de ventas', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminMovements)

    expect(await screen.findByText('Movimientos de stock')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ventas' })).toBeInTheDocument()
  })
})

describe('catálogo del panel', () => {
  it('crea un producto y lo da de baja sin borrarlo', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminInventoryTab(ADMIN_INVENTORY_TABS.products))

    expect(await screen.findByText('endurance-classic')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nuevo producto' }))
    const modal = await screen.findByRole('dialog', { name: 'Nuevo producto' })

    await user.click(await within(modal).findByRole('radio', { name: 'Sunga' }))
    await user.type(within(modal).getByLabelText(/Modelo/), 'sunga-pro')
    const price = within(modal).getByLabelText(/Precio/)
    await user.clear(price)
    await user.type(price, '1250')
    await user.click(within(modal).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('sunga-pro')).toBeInTheDocument()

    // Baja lógica: el último producto de la lista es el recién creado.
    const removes = screen.getAllByRole('button', { name: 'Eliminar' })
    await user.click(removes[removes.length - 1])
    const confirm = await screen.findByRole('dialog', { name: 'Dar de baja el producto' })
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('Dado de baja')).toBeInTheDocument()
    // Sigue en el panel (no se borró).
    expect(screen.getByText('sunga-pro')).toBeInTheDocument()
  })

  it('la ruta vieja del catálogo abre su pestaña', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminProducts)

    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument()
  })
})
