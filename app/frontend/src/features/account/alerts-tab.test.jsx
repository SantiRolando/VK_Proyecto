import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  Avisos de reposición: viven en la tercera pestaña de la información de cuenta. La seed deja a
  Ana suscripta al talle M de Endurance, que no tiene stock.
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
  await signInAs(SeedUser.Ana)
})

describe('pestaña de avisos de reposición', () => {
  it('lista la suscripción del cliente con su estado y su acción', async () => {
    renderAt(`${routes.accountInfo}?tab=alerts`)

    expect(
      await screen.findByRole('heading', { name: 'Avisos de reposición' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Endurance · M')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar aviso' })).toBeInTheDocument()
  })

  it('la ruta propia de avisos redirige a la pestaña', async () => {
    renderAt(routes.accountAlerts)

    expect(await screen.findByText('Endurance · M')).toBeInTheDocument()
    expect(screen.queryByText('404')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Avisos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('cancelar el aviso deja la pestaña vacía', async () => {
    const user = userEvent.setup()
    renderAt(`${routes.accountInfo}?tab=alerts`)

    await user.click(await screen.findByRole('button', { name: 'Cancelar aviso' }))

    // Cancelar refetchea la lista: con la suite entera corriendo, 1s no alcanza.
    expect(
      await screen.findByText('No tenés avisos de reposición.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Endurance · M')).not.toBeInTheDocument()
  })

  it('un admin no ve la pestaña ni el error de permisos', async () => {
    // El endpoint de avisos es de cliente: al admin la pestaña no se le ofrece.
    await signInAs(SeedUser.Admin)
    renderAt(`${routes.accountInfo}?tab=alerts`)

    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Avisos' })).not.toBeInTheDocument()
    expect(
      screen.queryByText('No tenés permisos para esta acción.'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Cuenta' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
