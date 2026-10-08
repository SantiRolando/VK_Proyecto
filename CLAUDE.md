# CLAUDE.md

## Documentación de Mantine UI

- La documentación completa de Mantine UI se encuentra en `agents/llms-full.txt`.
- Consulta ese archivo antes de escribir o modificar código que use componentes, hooks o estilos de Mantine: incluye props, API de estilos, ejemplos de uso y guías de solución de problemas.

## Convenciones de archivos React

- Archivos de componentes de React en kebab-case (ejemplo: `landing-page.jsx`).
- Los componentes en sí en PascalCase (ejemplo: `LandingPage`), según las mejores prácticas de React.

## Comentarios

- Un comentario de más de una línea va en bloque: `/*` solo en su línea, el texto adentro (un nivel de indentación más) y `*/` solo en la suya. No se repite `//` por línea; un comentario de una sola línea sigue en `//`.
- El comentario explica **qué pasa, resumido**, y nada más. No justifica lo que **no** se hizo ni la alternativa que se descartó, y no explica decisiones de estilo o de CSS: eso es ruido y se borra. Se corta la historia del cambio ("antes era…") y el detalle que el código ya muestra. Un aviso de trampa no obvia ("no lo pongas así, porque…") es lo único que vale la pena además de lo que pasa.
- Si hay que enumerar, una lista de viñetas es aceptable; el comentario no se convierte en un documento.
- Español, con los términos técnicos en inglés cuando es lo natural (`shell`, `hook`, `mock`, `endpoint`, `service`). No se traduce todo: se usa donde suena natural.
- Sin referencias a Jira ni a user stories: nada de `(T107)`, `(US10)`, `F6`, `R-06`, "bug squash sesión #1" ni "§4.5 del plan". Eso vive en el ticket, no en el código.
- El registro es el mismo que el de los tickets: español formal, sin voseo, frases cortas y directas, sin jerga decorativa ("robusto", "escalable", "potenciar"), con el vocabulario técnico natural (`API`, `hook`, `service`, `mock`, `endpoint`).
- Comillas rectas (`"`), sin mezclar estilos: es el default del proyecto, y solo se usan angulares si algo lo pide explícitamente.
- Un comentario sin contenido es ruido: si hay un `catch` que no hace nada, se dice qué caso cubre; si no hay nada que decir, no se comenta.

Ejemplos del ajuste del 08-oct-2026:

```js
// Mal: justifica lo que no se hizo.
/*
  Armazón de las secciones de contenido de la landing: contenedor, título y
  subtítulo. No fija fondo ni color de texto: el fondo de la página y el color los
  pone el tema, así que el claro y el oscuro salen sin ramas propias.
*/

// Bien: dice qué es y se calla.
/*
  Armazón de las secciones de contenido de la landing: contenedor, título y subtítulo.
*/
```

```js
// Mal: narra lo que hizo el barrido y defiende cada decisión.
/*
  La landing es la única pantalla fuera del armazón. El test amarra las tres cosas
  que el barrido dejó fijas: los enlaces del header apuntan a secciones que existen,
  las tres secciones del medio comparten la estructura de tres tarjetas, y el cierre
  lleva al generador como invitado y al login. Se monta el router real para que el
  `href` de cada enlace se pruebe contra el árbol de rutas, no contra un componente
  suelto.
*/

// Bien: la lista de lo que chequea, sin defensa.
/*
  La landing es la única pantalla fuera del shell. El test chequea lo siguiente
  - los enlaces del header apuntan a secciones que existen
  - las tres secciones del medio comparten la estructura de tres tarjetas
  - el cierre lleva al generador como invitado y al login
  Se monta el router real para probar el `href` de cada enlace contra el árbol de rutas.
*/
```

## Imports

- Usa los alias de `vite.aliases.js` en lugar de rutas relativas que suban de nivel: `@app`, `@api`, `@assets`, `@components`, `@config`, `@constants`, `@features`, `@hooks`, `@i18n`, `@mocks`, `@test`, `@theme`, `@utils`.
- Ejemplo: `import { Money } from '@components/money.jsx'`.
- `src/mocks/**` solo puede importarse desde `src/api/**` y desde el propio `src/mocks/**` (constitución VI); Biome lo verifica con `noRestrictedImports`.

## Lint y formato

- Biome es el único tool (`biome.json`): `npm run lint` (= `biome check .`) y `npm run format` (= `biome format --write .`).
- No hay regla automática de "sin literales visibles en JSX" ni de kebab-case: revisalas a mano (ver T005 del plan).
- Los literales de UI siempre van por `useI18n()`; la paridad es/en la verifica `src/i18n/i18n-parity.test.js`, que corre con `npm test`.

## Arquitectura de datos

- Cómo está armada la capa `componente → hook → service → apiClient → transport` (mock | http), cómo escribir un controller/service/hook nuevo y cómo pasar a la API real: `app/frontend/README.md`.
- Los componentes nunca importan `src/mocks/**`; la lógica de negocio (talle, puntos, stock, transiciones de venta) vive ahí, no en el FE.

## PWA

- Es una PWA instalable: manifest + service worker con `vite-plugin-pwa` en `vite.config.js` (precache del shell, `autoUpdate`). El service worker **no** se registra en `npm run dev`: para probarla, `npm run build && npm run preview` (y `--host` para instalarla desde el teléfono).
- Tené en cuenta el modo standalone al diseñar UI (pantalla completa, sin barra del navegador) y el estado offline: la app navega sin conexión, pero los datos de la API solo están si se vieron antes.
- Asset nuevo en `public/` que deba estar disponible offline ⇒ sumalo a `globPatterns`/`includeAssets` de `vite.config.js`.
- Pendiente al probar en dispositivo físico: `viewport-fit=cover` + safe-area insets (hoy el viewport es el estándar para no romper el header en notch).

## Internacionalización (i18n)

- Ningún string visible para el usuario debe escribirse como literal en el código; usa siempre claves de traducción con `useI18n()`.
- Añade cada clave a los locales de español e inglés en `src/i18n/locales/`.

## Rutas (routing)

- Las rutas de la aplicación deben definirse en inglés, independientemente del idioma que use el cliente (ejemplo: `/generator`, no `/generador`).
