import { apiClient } from '@api/client/api-client.js'
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
  La información de cuenta vive en `/account/info` con dos pestañas; las rutas viejas
  de la agenda redirigen ahí para no romper enlaces.
*/
describe('información de cuenta', () => {
  beforeEach(async () => {
    window.localStorage.setItem('vkfit.language', 'es')
    queryClient.clear()
    await testTools.resetDatabase()
  })

  const renderAt = (path) =>
    render(
      <Providers>
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>
      </Providers>,
    )

  /*
    El contenido vive en <main>; el header tiene sus propios controles, así que se
    acotan las consultas para no chocar con ellos.
  */
  const main = async () => within(await screen.findByRole('main'))

  it('muestra los datos de la cuenta en la pestaña Cuenta', async () => {
    await signInAs(SeedUser.Ana)
    renderAt(routes.accountInfo)

    const view = await main()
    expect(await view.findByText('Mi cuenta')).toBeInTheDocument()
    // Datos reales de la seed: Ana Rodríguez / ana@example.test.
    expect(view.getByText('Ana Rodríguez')).toBeInTheDocument()
    expect(view.getByText('ana@example.test')).toBeInTheDocument()
  })

  it('la pestaña de agenda muestra perfiles y direcciones de la seed', async () => {
    await signInAs(SeedUser.Ana)
    renderAt(`${routes.accountInfo}?tab=profiles-addresses`)

    const view = await main()
    // Perfiles de Ana en la seed: Training (predeterminado) y Son.
    expect(await view.findByText('Training')).toBeInTheDocument()
    expect(view.getByText('Son')).toBeInTheDocument()
    // Direcciones de la seed.
    expect(view.getByText(/Av\. Italia/)).toBeInTheDocument()
  })

  it('las pestañas se pueden cambiar y reflejan el estado en la URL', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Ana)
    renderAt(routes.accountInfo)

    const view = await main()
    expect(view.getByText('ana@example.test')).toBeInTheDocument()

    await user.click(view.getByRole('tab', { name: /Perfiles y direcciones/ }))

    await waitFor(() => {
      expect(within(view.getByRole('tabpanel')).getByText('Training')).toBeInTheDocument()
    })
  })

  it('la ruta vieja /account/profiles redirige a la pestaña de agenda', async () => {
    await signInAs(SeedUser.Ana)
    /*
      El controlador de perfiles tiene que responder: si la redirección no ocurre, la
      pantalla muestra el 404 y no hay perfiles.
    */
    const profiles = await apiClient.get('/profiles')
    expect(profiles.length).toBeGreaterThan(0)

    renderAt(routes.accountProfiles)

    const view = await main()
    expect(await view.findByText('Training')).toBeInTheDocument()
    expect(screen.queryByText('404')).not.toBeInTheDocument()
  })
})
