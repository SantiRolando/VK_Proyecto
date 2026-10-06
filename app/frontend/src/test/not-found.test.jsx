import { Providers } from '@app/providers.jsx'
import { NotFoundPage } from '@components/not-found-page.jsx'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  El fallback de rutas muestra un 404 explícito. Se usa `Providers` (i18n + Mantine)
  porque el componente usa Mantine.
*/
describe('not found page', () => {
  beforeEach(() => {
    window.localStorage.setItem('vkfit.language', 'es')
  })

  const renderPage = () =>
    render(
      <Providers>
        <MemoryRouter initialEntries={['/ruta-inexistente']}>
          <NotFoundPage />
        </MemoryRouter>
      </Providers>,
    )

  it('muestra el código 404, el título y el aviso', () => {
    renderPage()

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    expect(
      screen.getByText('La página que buscás no existe o fue movida.'),
    ).toBeInTheDocument()
  })

  it('ofrece volver al inicio', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
