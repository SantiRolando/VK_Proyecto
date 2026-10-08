import { createTheme } from '@mantine/core'

/*
  Tema apoyado en las paletas base de Mantine, sin colores propios.
*/
export const theme = createTheme({
  primaryColor: 'blue',
  autoContrast: true,
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  defaultRadius: 'md',
})

/*
  Azul de acento para las series de `@mantine/charts`: `getThemeColor` acepta `blue.6` pero **no**
  `primary`, que devuelve la cadena tal cual y termina en un `fill="primary"` inválido que el navegador
  pinta de negro.
*/
export const CHART_ACCENT = 'blue.6'

/*
  Tokens de la superficie elevada (`SurfaceCard`). El fondo de la app es blanco liso, así que la
  superficie necesita un gris propio, un degradado corto que la despegue del plano y una sombra
  suave: con el mismo color y un borde, una tarjeta no se distingue del fondo.

  El degradado va de más claro arriba a más oscuro abajo, que es como la luz trata una pieza
  elevada. En oscuro se invierte el criterio: la superficie es más clara que el fondo.
*/
export function cssVariablesResolver() {
  return {
    variables: {
      '--vk-accent': 'var(--mantine-color-blue-6)',
    },
    light: {
      '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
      '--mantine-color-placeholder': 'var(--mantine-color-gray-6)',
      '--vk-surface-background':
        'linear-gradient(180deg, var(--mantine-color-gray-0) 0%, var(--mantine-color-gray-1) 100%)',
      '--vk-surface-border': 'var(--mantine-color-gray-2)',
      '--vk-surface-shadow':
        '0 1px 2px rgba(16, 24, 40, 0.04), 0 6px 16px rgba(16, 24, 40, 0.07)',
      '--vk-surface-header-background': 'rgba(255, 255, 255, 0.55)',
      '--vk-surface-inset-background': 'var(--mantine-color-body)',
    },
    dark: {
      '--mantine-color-dimmed': 'var(--mantine-color-dark-1)',
      '--vk-surface-background':
        'linear-gradient(180deg, var(--mantine-color-dark-5) 0%, var(--mantine-color-dark-6) 100%)',
      '--vk-surface-border': 'var(--mantine-color-dark-4)',
      '--vk-surface-shadow':
        '0 1px 2px rgba(0, 0, 0, 0.35), 0 6px 16px rgba(0, 0, 0, 0.35)',
      '--vk-surface-header-background': 'rgba(255, 255, 255, 0.03)',
      '--vk-surface-inset-background': 'var(--mantine-color-dark-7)',
    },
  }
}
