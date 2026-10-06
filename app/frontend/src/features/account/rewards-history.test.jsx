import { rewardsService } from '@api/services/rewards-service.js'
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

// US6 de punta a punta sobre el router y los providers reales, contra el
// transporte mock: historial por perfil con feedback, canje de puntos y "mis
// compras". El idioma se fija en español para asertar texto visible real.

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

// El contenido vive en `<main>`: el header (selector de perfil) y los drawers
// (portales) quedan fuera y no ensucian las consultas por texto.
async function mainView() {
  return within(await screen.findByRole('main'))
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
})

describe('historial y feedback (US6)', () => {
  it('arranca con todos los perfiles y permite calificar una medición pendiente', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Ana)

    // Hay al menos una medición sin calificar.
    const pending = (await sizeService.listGenerations()).find(
      (generation) => generation.rating === null,
    )
    expect(pending).toBeTruthy()

    renderAt(routes.accountHistory)
    const view = await mainView()

    // Arranca sin filtrar: las mediciones sin perfil también se ven.
    await waitFor(() =>
      expect(view.getByLabelText('Filtrar por perfil')).toHaveValue('Todos los perfiles'),
    )

    // Califica la primera pendiente de la lista.
    await user.click(view.getAllByRole('button', { name: 'Calificar' })[0])
    const drawer = await screen.findByRole('dialog', { name: 'Calificá tu talle' })
    await user.click(within(drawer).getByRole('radio', { name: 'Correcto' }))
    await user.type(
      within(drawer).getByLabelText('Comentario (opcional)'),
      'Me quedó perfecto',
    )
    await user.click(within(drawer).getByRole('button', { name: 'Enviar feedback' }))

    // El resultado informa el premio (probabilístico) o su ausencia.
    expect(
      await within(drawer).findByText(/Sumaste \d+ puntos|no sumaste puntos/),
    ).toBeInTheDocument()

    // La calificación quedó guardada en el contrato.
    await waitFor(async () => {
      const list = await sizeService.listGenerations({ profileId: 1 })
      expect(list.find((generation) => generation.id === pending.id)).toMatchObject({
        rating: 'Correct',
        comment: 'Me quedó perfecto',
      })
    })
  })
})

describe('puntos y cupones (US6)', () => {
  it('canjea puntos por un cupón y lo muestra en mis cupones', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Ana)

    renderAt(routes.accountRewards)
    const view = await mainView()

    // Saldo sembrado y dos plantillas canjeables.
    expect(await view.findByText('120')).toBeInTheDocument()
    expect(view.getByText('VIKI10')).toBeInTheDocument()

    // ENVIO5 cuesta 60: se canjea y descuenta el saldo.
    await user.click(view.getAllByRole('button', { name: 'Canjear' })[1])
    expect(await view.findByText('60')).toBeInTheDocument()

    // El cupón propio aparece en "mis cupones" y VIKI10 queda fuera de alcance.
    expect(await view.findByText(/^ENVIO5-/)).toBeInTheDocument()
    expect(view.getAllByRole('button', { name: 'Canjear' })[0]).toBeDisabled()

    const mine = await rewardsService.listMyCoupons()
    expect(mine.map((coupon) => coupon.code)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^ENVIO5-/)]),
    )
  })
})

describe('mis compras (US6)', () => {
  it('lista las compras coordinadas con su estado', async () => {
    await signInAs(SeedUser.Ana)

    renderAt(routes.accountOrders)
    const view = await mainView()

    expect(await view.findByText('Pedido #1')).toBeInTheDocument()
    expect(view.getAllByText(/Pedido #/)).toHaveLength(4)
    expect(view.getAllByText('Confirmada').length).toBeGreaterThan(0)
  })
})
