# CLAUDE.md

## Documentación de Mantine UI

- La documentación completa de Mantine UI se encuentra en `agents/llms-full.txt`.
- Consulta ese archivo antes de escribir o modificar código que use componentes, hooks o estilos de Mantine: incluye props, API de estilos, ejemplos de uso y guías de solución de problemas.

## Convenciones de archivos React

- Archivos de componentes de React en kebab-case (ejemplo: `landing-page.jsx`).
- Los componentes en sí en PascalCase (ejemplo: `LandingPage`), según las mejores prácticas de React.

## Imports

- Usa los alias de `vite.aliases.js` en lugar de rutas relativas que suban de nivel: `@app`, `@api`, `@assets`, `@components`, `@config`, `@constants`, `@features`, `@hooks`, `@i18n`, `@mocks`, `@pages`, `@test`, `@theme`, `@utils`.
- Ejemplo: `import { Money } from '@components/money.jsx'`.
- `src/mocks/**` solo puede importarse desde `src/api/**` y desde el propio `src/mocks/**` (constitución VI); Biome lo verifica con `noRestrictedImports`.

## Lint y formato

- Biome es el único tool (`biome.json`): `npm run lint` (= `biome check .`) y `npm run format` (= `biome format --write .`).
- No hay regla automática de "sin literales visibles en JSX" ni de kebab-case: revisalas a mano (ver T005 del plan).
- Los literales de UI siempre van por `useI18n()`; el gate automático de paridad es `npm run i18n:check`.

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
