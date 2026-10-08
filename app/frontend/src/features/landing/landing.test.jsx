import { Providers } from '@app/providers.jsx'
import { AppRouter } from '@app/router.jsx'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  La landing es la única pantalla fuera del armazón. El test amarra las tres cosas que el
  barrido dejó fijas: los enlaces del header apuntan a secciones que existen, las tres
  secciones del medio comparten la estructura de tres tarjetas, y el cierre lleva al
  generador como invitado y al login. Se monta el router real para que el `href` de cada
  enlace se pruebe contra el árbol de rutas, no contra un componente suelto.
*/
function LocationProbe() {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{`${pathname}${search}`}</span>
}

const renderLanding = (language = 'es') => {
  window.localStorage.setItem('vkfit.language', language)
  return render(
    <Providers>
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
        <LocationProbe />
      </MemoryRouter>
    </Providers>,
  )
}

describe('landing pública', () => {
  beforeEach(() => {
    window.localStorage.setItem('vkfit.language', 'es')
  })

  it('los enlaces del header apuntan a secciones que existen', () => {
    const { container } = renderLanding()

    const anchors = [...container.querySelectorAll('header nav a')]
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
      '#how',
      '#benefits',
      '#store',
    ])
    for (const anchor of anchors) {
      const target = container.querySelector(anchor.getAttribute('href'))
      expect(target, `sin destino para ${anchor.getAttribute('href')}`).not.toBeNull()
    }
  })

  it('las tres secciones del medio tienen la misma estructura de tres tarjetas', () => {
    const { container } = renderLanding()

    for (const id of ['how', 'benefits', 'store']) {
      const section = container.querySelector(`#${id}`)
      expect(section, `sin la sección #${id}`).not.toBeNull()

      const titulo = section.querySelector('h2')
      expect(titulo.textContent.length).toBeGreaterThan(0)
      expect(section.querySelector('h2 + p').textContent.length).toBeGreaterThan(0)

      const cards = [...section.querySelectorAll('.grid > div')]
      expect(cards, `#${id} sin tres tarjetas`).toHaveLength(3)
      for (const card of cards) {
        expect(card.querySelector('svg')).not.toBeNull()
        expect(card.querySelector('h3').textContent.length).toBeGreaterThan(0)
        expect(card.querySelector('p').textContent.length).toBeGreaterThan(0)
      }
    }
  })

  it('los títulos van de h1 a h2, sin saltos', () => {
    renderLanding()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      'Cómo funciona',
      '¿Por qué usarlo?',
      'Para la tienda',
      '¿Listo para empezar?',
    ])
  })

  it('el cierre entra al generador como invitado y conserva el origen', async () => {
    const user = userEvent.setup()
    renderLanding()

    await user.click(screen.getByRole('button', { name: 'Probar' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/fit?src=landing')
    })
  })

  it('el cierre lleva al login', async () => {
    const user = userEvent.setup()
    renderLanding()

    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login')
    })
  })

  it('en inglés se leen las cuatro secciones y ninguna clave cruda', () => {
    renderLanding('en')

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['How it works', 'Why use it?', 'For the store', 'Ready to get started?'])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your ideal swimming size',
    )
    expect(screen.queryByText('how.title')).not.toBeInTheDocument()
    expect(screen.queryByText('cta.guest')).not.toBeInTheDocument()
  })
})
