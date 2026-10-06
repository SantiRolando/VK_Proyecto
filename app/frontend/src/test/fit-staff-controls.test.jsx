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

// Bug squash sesión #1: el modo asistente dejó de ser una ruta propia
// (`/admin/assistant`) y pasó a ser un control dentro de `/fit`, visible solo
// para un admin. `/fit` ahora es compartido, así que hay que garantizar que un
// cliente NO vea los controles de personal.
describe('medición: controles de personal', () => {
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

  it('un admin ve el switch "Para terceros" en /fit', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.fit())

    await waitFor(() => {
      expect(screen.getByText('Para terceros')).toBeInTheDocument()
    })
  })

  it('un cliente NO ve los controles de personal', async () => {
    await signInAs(SeedUser.Ana)
    renderAt(routes.fit())

    // El formulario tiene que estar montado antes de afirmar una ausencia.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /obtener mi talle/i }),
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('Para terceros')).not.toBeInTheDocument()
    expect(screen.queryByText('Vincular a un cliente')).not.toBeInTheDocument()
  })

  it('la ruta vieja del asistente ya no existe', async () => {
    await signInAs(SeedUser.Admin)
    renderAt('/admin/assistant')

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument()
    })
  })
})
