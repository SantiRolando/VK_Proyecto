import { setSession } from '@api/client/session.js'
import { catalogService } from '@api/services/catalog-service.js'
import { devService } from '@api/services/dev-service.js'
import { sizeService } from '@api/services/size-service.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Estados de error (T107, FR-029): se encienden con la simulación de fallos del
// mock (`POST /dev/router { failRate }`), que no aplica a las propias
// herramientas de `/dev` y por eso se puede apagar desde el test.

const ANA = 2

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

async function signInAs(userId) {
  const { user, token } = await devService.loginAs(userId)
  setSession(token, user)
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await devService.reset()
  await devService.setMockRouter({ latencyMs: '0', failRate: 0 })
})

afterEach(async () => {
  // La simulación no debe quedar encendida para el resto de la suite.
  await devService.setMockRouter({ failRate: 0 })
})

describe('estados de error (T107)', () => {
  it('el detalle de producto (invitado) muestra el error y reintenta', async () => {
    const user = userEvent.setup()
    const size = (await sizeService.getSizes({ line: 'Endurance' })).find(
      (item) => item.code === 'L',
    )
    const product = (await catalogService.list({ line: 'Endurance', sizeId: size.id }))
      .items[0]

    await devService.setMockRouter({ failRate: 1 })
    renderAt(routes.product(product.id, { sizeId: size.id }))

    expect(await screen.findByText('Ocurrió un error.')).toBeInTheDocument()

    await devService.setMockRouter({ failRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('heading', { name: product.model }),
    ).toBeInTheDocument()
  })

  it('el historial del cliente muestra el error y se recupera', async () => {
    const user = userEvent.setup()
    await signInAs(ANA)
    renderAt(routes.accountHistory)

    // Primero carga bien.
    const view = within(await screen.findByRole('main'))
    await waitFor(() =>
      expect(view.getByLabelText('Filtrar por perfil')).toHaveValue('Training'),
    )

    // Se cae el backend simulado y se fuerza un refetch.
    await devService.setMockRouter({ failRate: 1 })
    await queryClient.invalidateQueries({ queryKey: ['size-generations'] })

    expect(await screen.findByText('Ocurrió un error.')).toBeInTheDocument()

    await devService.setMockRouter({ failRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() =>
      expect(screen.queryByText('Ocurrió un error.')).not.toBeInTheDocument(),
    )
  })

  it('el catálogo (invitado) muestra el error y reintenta', async () => {
    const user = userEvent.setup()
    const size = (await sizeService.getSizes({ line: 'Endurance' })).find(
      (item) => item.code === 'L',
    )
    renderAt(routes.catalog({ line: 'Endurance', sizeId: size.id }))

    // Primero carga bien (una tarjeta por producto con stock).
    expect(
      (await screen.findAllByRole('button', { name: 'Ver' })).length,
    ).toBeGreaterThan(0)

    await devService.setMockRouter({ failRate: 1 })
    await queryClient.invalidateQueries({ queryKey: ['catalog'] })

    expect(await screen.findByText('Ocurrió un error.')).toBeInTheDocument()

    await devService.setMockRouter({ failRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      (await screen.findAllByRole('button', { name: 'Ver' })).length,
    ).toBeGreaterThan(0)
  })

  it('las direcciones del cliente muestran el error y se recuperan', async () => {
    const user = userEvent.setup()
    await signInAs(ANA)
    renderAt(routes.accountAddresses)

    expect(await screen.findByText('Predeterminada')).toBeInTheDocument()

    await devService.setMockRouter({ failRate: 1 })
    await queryClient.invalidateQueries({ queryKey: ['addresses'] })

    expect(await screen.findByText('Ocurrió un error.')).toBeInTheDocument()

    await devService.setMockRouter({ failRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Predeterminada')).toBeInTheDocument()
  })
})
