import { Providers } from '@app/providers.jsx'
import { ThemePicker } from '@components/theme-picker.jsx'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

// F6 (bug squash sesión #1): el selector de tema ofrece claro / oscuro / sistema.
describe('theme picker', () => {
  beforeEach(() => {
    window.localStorage.setItem('vkfit.language', 'es')
    window.localStorage.removeItem('mantine-color-scheme-value')
  })

  it('ofrece las tres opciones con nombre accesible', () => {
    render(
      <Providers>
        <ThemePicker />
      </Providers>,
    )

    expect(screen.getByRole('img', { name: 'Claro' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Oscuro' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Sistema' })).toBeInTheDocument()
  })

  it('expone el grupo con etiqueta traducida', () => {
    render(
      <Providers>
        <ThemePicker />
      </Providers>,
    )

    expect(screen.getByLabelText('Tema')).toBeInTheDocument()
  })
})
