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

export function cssVariablesResolver() {
  return {
    variables: {
      '--vk-accent': 'var(--mantine-color-blue-6)',
    },
    light: {
      '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
      '--mantine-color-placeholder': 'var(--mantine-color-gray-6)',
    },
    dark: {
      '--mantine-color-dimmed': 'var(--mantine-color-dark-1)',
    },
  }
}
