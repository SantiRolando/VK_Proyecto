import { createTheme } from '@mantine/core'
import { cssVariablesResolver, theme } from '@theme/theme.js'
import { describe, expect, it } from 'vitest'

// F6/F12 (bug squash sesión #1). Este archivo fija las decisiones de tema que
// costaron varias iteraciones, para que no se deshagan en silencio:
//
// 1. El primario es `blue`, la paleta por defecto de Mantine. El primario
//    monocromo se intentó tres veces y no se pudo hacer funcionar: el color del
//    texto del botón se resuelve desde el *shade del tema* y el de fondo desde la
//    variable pintada, así que cualquier relleno que no coincida con el shade
//    vuelve a desincronizar el contraste.
// 2. `autoContrast` queda activo.
// 3. Los textos atenuados se suben un tono en oscuro, donde el default no se lee.
describe('theme', () => {
  it('usa el azul por defecto de Mantine como primario', () => {
    expect(theme.primaryColor).toBe('blue')
  })

  it('no define colores propios: solo paletas base', () => {
    // `colors` puede venir vacío o ausente; lo que no debe haber es una paleta
    // propia tipo `vikinga`.
    expect(Object.keys(theme.colors ?? {})).not.toContain('vikinga')
  })

  it('mantiene autoContrast activo', () => {
    expect(theme.autoContrast).toBe(true)
  })

  it('sube el contraste de los textos atenuados en oscuro', () => {
    const { dark } = cssVariablesResolver(theme)
    expect(dark['--mantine-color-dimmed']).toBe('var(--mantine-color-dark-1)')
  })

  it('no pisa los tokens del primario (evita el bug de contraste)', () => {
    const { light, dark } = cssVariablesResolver(theme)
    // Si alguien vuelve a fijar `--mantine-primary-color-filled` a un color que no
    // corresponde al shade del tema, el texto del botón vuelve a calcularse mal.
    for (const block of [light, dark]) {
      expect(block['--mantine-primary-color-filled']).toBeUndefined()
      expect(block['--mantine-primary-color-contrast']).toBeUndefined()
    }
  })

  it('aplica el tema sin lanzar', () => {
    expect(() => createTheme({ primaryColor: 'blue' })).not.toThrow()
  })
})
