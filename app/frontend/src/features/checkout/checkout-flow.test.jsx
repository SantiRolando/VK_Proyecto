import { clearSession } from '@api/client/session.js'
import { catalogService } from '@api/services/catalog-service.js'
import { salesService } from '@api/services/sales-service.js'
import { sizeService } from '@api/services/size-service.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Flujo completo de US4 sobre el router y los providers reales: la app habla
// con el transporte mock (modo mock del `api-client`), así que se navega y se
// confirma la compra igual que un cliente, y después se verifican los efectos
// en el contrato (`/me/sales`).
//
// El idioma se fija en español para que las aserciones sean texto visible real.

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

async function sizeOf(line, code) {
  const sizes = await sizeService.getSizes({ line })
  return sizes.find((size) => size.code === code)
}

function colorOf(detail, color) {
  return detail.colors.find((item) => item.color === color)
}

async function firstEnduranceProduct(sizeId) {
  const catalog = await catalogService.list({ line: 'Endurance', sizeId })
  return catalog.items.find((item) => item.model === 'endurance-classic')
}

// El checkout espera a que la agenda llegue para preseleccionar la dirección
// predeterminada y a que el producto resuelva el talle elegido.
async function goToSummary(user) {
  await user.click(await screen.findByRole('button', { name: 'Continuar' }))
  await user.click(await screen.findByRole('button', { name: 'Continuar' }))
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  // La DB mock es un módulo con estado: se re-siembra con las herramientas de la suite.
  await testTools.resetDatabase()
})

describe('checkout (flujo completo)', () => {
  it('va del detalle de producto a la confirmación con el mensaje de coordinación', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    await signInAs(SeedUser.Ana)

    // Talle L de Endurance (la generación 100 es de Ana).
    const sizeL = await sizeOf('Endurance', 'L')
    const product = await firstEnduranceProduct(sizeL.id)
    const availableBefore = colorOf(
      await catalogService.get(product.id, { sizeId: sizeL.id }),
      'navy',
    ).available

    renderAt(routes.product(product.id, { sizeId: sizeL.id, generationId: 100 }))

    // Detalle: el color con stock queda seleccionado y se puede coordinar.
    expect(
      await screen.findByRole('heading', { name: 'endurance-classic' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Coordinar compra' }))

    // Paso 1 — entrega: envío a domicilio con la dirección predeterminada.
    expect(
      await screen.findByText('Elegí cómo entregamos y por dónde coordinamos el pago.'),
    ).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Código del cupón')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Envío a domicilio' }))
    expect(
      await screen.findByText(
        'Av. Italia 1234, Montevideo, Montevideo, Casa con reja blanca',
      ),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Elegí una dirección')).toHaveValue(
      'Av. Italia 1234, Montevideo',
    )

    // Paso 2 — canal: WhatsApp.
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('radio', { name: 'WhatsApp' }))
    expect(screen.getByRole('radio', { name: 'WhatsApp' })).toBeChecked()

    // Paso 3 — resumen: cupón aplicado por el mock (10% de 1290, tope 500).
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    // Los cupones propios del cliente (US6) quedan a un clic.
    expect(await screen.findByRole('button', { name: 'ANA15' })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Código del cupón'), 'VIKI10')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(await screen.findByText(/Cupón VIKI10: -/)).toBeInTheDocument()
    expect(screen.getByText(/1\.161/)).toBeInTheDocument()

    // Confirmación: la venta queda pendiente y con el mensaje ya armado.
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByRole('heading', { name: 'Compra coordinada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Pendiente de coordinación')).toBeInTheDocument()

    // El mensaje (armado por el mock) describe la compra y el canal elegido.
    expect(screen.getByText(/Pedido #\d+/)).toBeInTheDocument()
    expect(screen.getByText(/Entrega: Envío a domicilio/)).toBeInTheDocument()
    expect(screen.getByText(/Datos del cliente:/)).toBeInTheDocument()
    expect(screen.getByText(/Nombre: Ana Rodríguez/)).toBeInTheDocument()

    // Se abre el canal con el mensaje listo, y queda el enlace de respaldo.
    const openLink = screen.getByRole('link', { name: 'Abrir WhatsApp' })
    expect(openLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/59899000000\?text=/)
    await waitFor(() => expect(openSpy).toHaveBeenCalled())
    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/59899000000\?text=/)

    // Efectos en el contrato: venta con descuento y stock reservado.
    const sales = await salesService.listMine()
    expect(sales[0]).toMatchObject({
      status: 'PendingCoordination',
      channel: 'Whatsapp',
      deliveryMethod: 'HomeDelivery',
      subtotal: 1290,
      discount: 129,
      total: 1161,
      coupon: { code: 'VIKI10' },
    })
    expect(sales[0].lines[0]).toMatchObject({ quantity: 1, color: 'navy' })

    const availableAfter = colorOf(
      await catalogService.get(product.id, { sizeId: sizeL.id }),
      'navy',
    ).available
    expect(availableAfter).toBe(availableBefore - 1)
  })

  it('informa el conflicto de stock sin perder la selección', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Ana)

    // `sunga-classic` S rojo: la única unidad está reservada por una venta
    // sembrada de otro cliente, así que no hay disponible.
    const sizeS = await sizeOf('Sunga', 'S')
    const catalog = await catalogService.list({ line: 'Sunga', sizeId: sizeS.id })
    const product = catalog.items.find((item) => item.model === 'sunga-classic')
    const soldOut = colorOf(
      await catalogService.get(product.id, { sizeId: sizeS.id }),
      'red',
    )
    expect(soldOut.available).toBe(0)

    renderAt(
      routes.checkout({
        variantId: soldOut.id,
        productId: product.id,
        sizeId: sizeS.id,
      }),
    )

    await goToSummary(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByText(
        'Se agotó el stock de ese producto mientras completabas la compra.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'No perdimos tu selección. Ajustá la cantidad o elegí otro color.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Disponible ahora: 0')).toBeInTheDocument()

    // La selección sigue en pantalla y no se creó ninguna venta: Ana tiene las
    // cuatro ventas sembradas (la quinta es de otro cliente).
    expect(screen.getAllByText('sunga-classic').length).toBeGreaterThan(0)
    const sales = await salesService.listMine()
    expect(sales).toHaveLength(4)
  })

  it('rechaza un cupón inválido sin frenar la compra', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Ana)

    const sizeL = await sizeOf('Endurance', 'L')
    const product = await firstEnduranceProduct(sizeL.id)
    const selectedColor = (
      await catalogService.get(product.id, { sizeId: sizeL.id })
    ).colors.find((color) => color.available > 0)

    renderAt(
      routes.checkout({
        variantId: selectedColor.id,
        productId: product.id,
        sizeId: sizeL.id,
      }),
    )

    await goToSummary(user)
    await user.type(screen.getByPlaceholderText('Código del cupón'), 'NOEXISTE')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(await screen.findByText('El cupón no es válido.')).toBeInTheDocument()
    // Sin descuento: el total sigue siendo el subtotal y se puede confirmar.
    expect(screen.queryByText(/Cupón NOEXISTE/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
  })

  it('manda al invitado al login conservando el destino', async () => {
    clearSession()
    const target = routes.checkout({ variantId: 1, productId: 1, sizeId: 1 })

    renderAt(target)

    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()

    // Desde el login puede crear la cuenta y volver al checkout.
    const registerLink = screen.getByRole('link', { name: 'Crear cuenta' })
    expect(registerLink.getAttribute('href')).toContain(encodeURIComponent(target))
  })
})
