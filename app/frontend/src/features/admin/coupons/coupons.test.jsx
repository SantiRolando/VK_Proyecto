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
import { beforeEach, describe, expect, it } from 'vitest'

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

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  await testTools.resetDatabase()
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
  })

  it('editar el costo de canje se refleja en el catálogo de recompensas', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.adminCoupons)

    const row = (await screen.findByText('ENVIO5')).closest('tr')
    await user.click(within(row).getByRole('button', { name: 'Editar cupón' }))

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
})
