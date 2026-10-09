import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  `/account` tiene que resolver, no caer en el 404: el layout autenticado no tiene
  `path` y un `index` sin path matchea la ruta del padre. El porqué completo está en
  `routes.js`.
*/
describe('destinos post-login', () => {
  beforeEach(async () => {
    window.localStorage.setItem('vkfit.language', 'es')
    queryClient.clear()
    await testTools.resetDatabase()
    await signInAs(SeedUser.Ana)
  })

  const renderAt = (path) =>
    render(
      <Providers>
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>
      </Providers>,
    )

  it('routes.account renderiza el historial y no el 404', async () => {
    renderAt(routes.account)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Historial' })).toBeInTheDocument()
    })
    expect(screen.queryByText('404')).not.toBeInTheDocument()
  })

  it('routes.account no es la raíz ni cae en el namespace sin ruta', () => {
    /*
      Guarda contra la regresión: si `account` vuelve a `/account` o a un `index`,
      este test solo pasa mientras la ruta tenga path propio.
    */
    expect(routes.account.startsWith(routes.accountRoot)).toBe(true)
    expect(routes.account).not.toBe(routes.accountRoot)
  })

  it('un path inexistente bajo /account sigue mostrando el 404', async () => {
    renderAt('/account/no-existe')

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument()
    })
  })

  it('un admin que pasa por el login cae en el panel y no en su cuenta', async () => {
    // El guard de invitados mandaba a la cuenta a cualquiera con sesión, admin incluido.
    await signInAs(SeedUser.Admin)
    renderAt(routes.login)

    expect(await screen.findByRole('heading', { name: 'Analíticas' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Historial' })).not.toBeInTheDocument()
  })
})
