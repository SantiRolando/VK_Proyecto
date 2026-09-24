import { createTheme } from '@mantine/core'

// Paleta placeholder "vikinga" (R-13): azul profundo de pileta, 10 tonos de
// claro a oscuro. Reemplazar por la paleta de marca cuando esté disponible.
const vikinga = [
  '#E8F0FA',
  '#D1E2F5',
  '#A3C5EB',
  '#75A8E0',
  '#478BD6',
  '#1F6FCB',
  '#1959A2',
  '#134379',
  '#0D2D51',
  '#071728',
]

export const theme = createTheme({
  primaryColor: 'vikinga',
  colors: { vikinga },
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  defaultRadius: 'md',
})
