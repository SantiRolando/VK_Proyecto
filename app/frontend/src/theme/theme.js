import { createTheme } from '@mantine/core'

// Tema apoyado en las paletas base de Mantine. Sin colores propios.
//
// PRIMARIO: `blue` (el azul por defecto de Mantine).
//
// Historia, para que nadie lo reintente: el primario monocromo (negro en claro,
// blanco en oscuro) se intentó tres veces y no se pudo hacer funcionar. La causa
// está en `default-variant-colors-resolver`:
//
//   const textColor = _autoContrast
//     ? (parsed.isLight ? 'var(--mantine-color-black)' : 'var(--mantine-color-white)')
//     : 'var(--mantine-color-white)'
//
// `parsed` sale del **shade del tema** (`gray-6`), no del color realmente
// pintado, que venía de un override en CSS. En tema oscuro el shade era claro
// mientras el relleno pintado era blanco, así que elegía texto blanco sobre
// blanco. Cualquier primario cuyo relleno no coincida con el shade del tema
// vuelve a caer en esa inconsistencia: el color de texto y el de fondo se
// resuelven por caminos distintos.
//
// Con `primaryColor: 'blue'` no hay override: el shade del tema y el relleno
// pintado son el mismo, y Mantine resuelve el contraste solo en ambos esquemas.
//
// Semánticos, para no usar el primario donde el color comunica algo:
//   positivo / confirmar   -> green
//   negativo / destructivo -> red
//   advertencia            -> yellow
export const theme = createTheme({
  primaryColor: 'blue',
  autoContrast: true,
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  defaultRadius: 'md',
})

// Azul de acento, en el formato que consumen las series de `@mantine/charts`.
//
// Los gráficos resuelven el color con `getThemeColor(color, theme)`: acepta
// `blue.6` (-> `var(--mantine-color-blue-6)`) pero **no** `primary`, que devuelve
// la cadena tal cual y termina en un `fill="primary"` inválido que el navegador
// pinta de negro. Ese fue el bug de la barra negra del dashboard.
export const CHART_ACCENT = 'blue.6'

export function cssVariablesResolver() {
  return {
    variables: {
      // Mismo acento en formato CSS, para el mapa de calor de talles faltantes
      // (que lo necesita como valor de estilo, no como token de gráfico).
      '--vk-accent': 'var(--mantine-color-blue-6)',
    },
    light: {
      // Contraste (T103): `dimmed` y `placeholder` por defecto no llegan a 4.5:1
      // sobre blanco; se oscurecen un tono.
      '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
      '--mantine-color-placeholder': 'var(--mantine-color-gray-6)',
    },
    dark: {
      // Los ítems de navegación inactivos usan `dimmed`: en oscuro el default no
      // se lee sobre el fondo, así que se sube un tono (bug squash sesión #1).
      '--mantine-color-dimmed': 'var(--mantine-color-dark-1)',
    },
  }
}
