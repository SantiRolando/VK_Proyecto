# CLAUDE.md

## Documentación de Mantine UI

- La documentación completa de Mantine UI se encuentra en `agents/llms-full.txt`.
- Consulta ese archivo antes de escribir o modificar código que use componentes, hooks o estilos de Mantine: incluye props, API de estilos, ejemplos de uso y guías de solución de problemas.

## Convenciones de archivos React

- Archivos de componentes de React en kebab-case (ejemplo: `landing-page.jsx`).
- Los componentes en sí en PascalCase (ejemplo: `LandingPage`), según las mejores prácticas de React.

## Comentarios

- Un comentario de más de una línea va en bloque: `/*` solo en su línea, el texto adentro (un nivel de indentación más) y `*/` solo en la suya. No se repite `//` por línea; un comentario de una sola línea sigue en `//`.
- El bloque dice el porqué y qué alternativa se descartó. Se corta la historia del cambio («antes era…»), el detalle que el código ya muestra y las enumeraciones que se pueden resumir.
- Sin referencias a Jira ni a user stories: nada de `(T107)`, `(US10)`, `F6`, `R-06`, «bug squash sesión #1» ni «§4.5 del plan». Eso vive en el ticket, no en el código.
- El registro es el mismo que el de los tickets: español formal, sin voseo, frases cortas y directas, sin jerga decorativa («robusto», «escalable», «potenciar»), con el vocabulario técnico natural (`API`, `hook`, `service`, `mock`, `endpoint`).
- Un comentario sin contenido es ruido: si hay un `catch` que no hace nada, se dice qué caso cubre; si no hay nada que decir, no se comenta.

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
