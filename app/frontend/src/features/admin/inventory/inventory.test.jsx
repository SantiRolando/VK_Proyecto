import { adminInventoryService } from '@api/services/admin-inventory-service.js'
import { catalogService } from '@api/services/catalog-service.js'
import { sizeService } from '@api/services/size-service.js'
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
import { beforeEach, describe, expect, it } from 'vitest'

/*
  Inventario y catálogo sobre el router y los providers reales: ajuste de stock con motivo
  (auditado) y CRUD del catálogo del panel.
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

async function rowOf(sku) {
  return (await screen.findByText(sku)).closest('tr')
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('inventario', () => {
  it('ajusta el stock con motivo, deja el movimiento auditado y el catálogo lo refleja', async () => {
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
    await user.click(within(modal).getByRole('button', { name: 'Registrar movimiento' }))

    // El inventario refleja el físico nuevo y sale del estado crítico.
    await waitFor(async () => {
      const { items } = await adminInventoryService.listVariants({ line: 'Endurance' })
      expect(items.find((item) => item.sku === EMPTY_SKU)).toMatchObject({
        quantity: 4,
        available: 4,
        isCritical: false,
      })
    })
    await waitFor(async () => {
      const updated = await rowOf(EMPTY_SKU)
      expect(within(updated).queryByText('Crítico')).not.toBeInTheDocument()
    })

    // Quedó el movimiento auditable con su motivo y autor.
    const movements = await adminInventoryService.listTransactions({
      variantId: (
        await adminInventoryService.listVariants({ line: 'Endurance' })
      ).items.find((item) => item.sku === EMPTY_SKU).id,
    })
    expect(movements.items).toHaveLength(1)
    expect(movements.items[0]).toMatchObject({
      reason: 'GoodsReceipt',
      direction: 'Inbound',
      user: { name: 'Vikinga Admin' },
    })

    // El catálogo del cliente ya ofrece el talle M de Endurance.
    const size = (await sizeService.getSizes({ line: 'Endurance' })).find(
      (item) => item.code === 'M',
    )
    const catalog = await catalogService.list({ sizeId: size.id })
    expect(catalog.meta.hasStock).toBe(true)
  })

  it('lista la auditoría de movimientos con motivo, dirección y autor', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminMovements)

    expect(await screen.findByText('Movimientos de stock')).toBeInTheDocument()
    // Los 4 movimientos sembrados.
    expect((await screen.findAllByText('Entrada')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Vikinga Admin').length).toBeGreaterThan(0)
    expect(screen.getByText('4 movimientos')).toBeInTheDocument()
  })
})

describe('catálogo del panel', () => {
  it('crea un producto y lo da de baja sin borrarlo', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminProducts)

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
})
