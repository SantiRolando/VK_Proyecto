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

// Bug squash sesión #1: `/account` mostraba el 404. El layout autenticado no
// tiene `path`, y el `index` de una ruta sin path matchea la ruta del padre (o
// sea `/`), no `/account`; el catch-all se lo comía. `routes.account` apunta
// ahora a una ruta con path real.
describe('destino post-login del cliente', () => {
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
    // Guarda contra la regresión: si alguien vuelve `account` a `/account` (o a
    // un `index`), este test sigue pasando solo si existe una ruta con path.
    expect(routes.account.startsWith(routes.accountRoot)).toBe(true)
    expect(routes.account).not.toBe(routes.accountRoot)
  })

  it('un path inexistente bajo /account sigue mostrando el 404', async () => {
    renderAt('/account/no-existe')

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument()
    })
  })
})
