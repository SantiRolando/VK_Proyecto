# Scan VKFit — Frontend (prototipo)

Prototipo de la app de Scan VKFit: recomendación de talle para indumentaria de
natación (cliente) y compra coordinada + panel de administración (equipo de la
tienda). React 19 + Vite + Mantine 9 + TanStack Query, mobile-first (PWA: el
soporte offline llega en una iteración posterior).

- Plan y tareas: `../../agents/scan-vkfit-fe-prototype-plan.md`
- Estado consolidado y pendientes: `../../agents/scan-vkfit-estado-y-pendientes.md`
- Detalle por iteración: `../../agents/iteraciones.md`
- Reglas del proyecto: `../../CLAUDE.md`

## Arranque

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (modo mock por defecto). |
| `npm run build` / `npm run preview` | Build de producción y servidor local del bundle. |
| `npm test` / `npm run test:watch` | Vitest + jsdom + Testing Library. |
| `npm run lint` / `npm run format` | Biome (lint + formato + imports restringidos). Es el único tool. |
| `npm run i18n:check` | Verifica paridad de claves entre `es` y `en`. |

### Cuentas demo (modo mock)

| Usuario | Credenciales | Qué trae |
|---|---|---|
| Admin | `admin@vikinga.test` / `admin123` | Panel completo (`/admin`). |
| Cliente | `ana@example.test` / `cliente123` | 2 perfiles, 2 direcciones, saldo de puntos. |
| Cliente vacío | `cliente@example.test` / `cliente123` | Sin datos (estados vacíos). |

En desarrollo también está **`/dev`**: re-siembra la base (`reset`), entra como
cualquier usuario sin pasar por el login (`login-as`) y regula en caliente la
latencia y la tasa de fallos del mock — así se ven los estados de carga y error
sin reiniciar la app.

## Arquitectura de la capa de datos

Los componentes **nunca** conocen la fuente de datos: sólo hooks de TanStack
Query; los hooks sólo llaman a un *service*; el service sólo sabe de paths,
métodos HTTP y DTOs; el *api-client* decide el transporte.

```
Componente → hook (TanStack Query) → service → apiClient → transport
                                                              ├─ mock: mock-router → controller → domain/* → db (localStorage)
                                                              └─ http: fetch contra la API real
```

```
src/
├── api/
│   ├── client/       # api-client, session (token/guest), transports (mock|http), ApiError
│   └── services/     # un service por recurso (catalog-service, sales-service, …)
├── features/         # una carpeta por historia/área (fit, catalog, checkout, account, admin/…)
│                     #   cada una con hooks/, páginas y componentes propios
├── components/       # UI compartida (layouts, feedback, order-summary, badges, …)
├── mocks/            # descartable: router, controllers, domain (reglas), db (seed + persistencia)
├── app/              # router, routes, providers, guards, env
├── i18n/             # provider + locales es/en (todas las claves)
├── theme/, utils/, constants/, hooks/, pages/ (landing y /dev), test/
```

Contrato de la capa de datos (§6.1 del plan):

- **Respuesta** `{ status, data, meta }`. `apiClient.get/post/...` devuelven
  `data`; `apiClient.request` devuelve la respuesta completa cuando la pantalla
  necesita `meta` (p. ej. `GET /catalog` con `meta.hasStock`).
- **Error** `ApiError(status, code, details)` con códigos estables
  (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
  `STOCK_INSUFFICIENT`, `NETWORK_ERROR`, `SERVER_ERROR`). `ErrorState` los
  traduce con `errors.<CODE>`; un 401 por sesión expirada dispara el logout
  global desde `api-client`.
- **Sin lógica de negocio en el FE**: talles, puntos, reserva de stock y
  transiciones de venta viven en `src/mocks/domain/`.

## Cómo escribir un endpoint nuevo

Ejemplo: `GET /products/{id}/reviews`. El orden es siempre el mismo.

1. **Dominio** (si hay reglas): `src/mocks/domain/reviews.js` y su test. Nada de
   cálculos en el controller ni, menos aún, en el componente.
2. **Controller** (`src/mocks/controllers/reviews.controller.js`):

```js
import { ApiError } from '@api/client/api-error.js'
import { getDb } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

register('GET', '/products/:productId/reviews', (req) => {
  const db = getDb()
  const product = db.products.find((item) => item.id === Number(req.params.productId))
  if (!product) throw new ApiError(404, 'NOT_FOUND')

  return { status: 200, data: db.reviews.filter((r) => r.productId === product.id) }
})
```

   `req` es `{ params, query, body, auth: { token, user } | null, guestSessionId }`.
   Para exigir sesión o rol, tercer argumento de `register`:
   `register('POST', '/reviews', handler, { auth: 'customer' })` (`'user'`,
   `'customer'`, `'admin'`). Las respuestas con `status >= 400` se traducen solas
   a `ApiError`; también se puede lanzar `ApiError` directamente.
   Los handlers se pueden testear sin React (ver `*.controller.test.js`).
3. **Registro**: agregar el import en `src/mocks/controllers/register-all.js`.
4. **Service** (`src/api/services/reviews-service.js`): único lugar donde se
   mapean DTOs (si la API real usa `snake_case`, se convierte acá).

```js
import { apiClient } from '@api/client/api-client.js'

export const reviewsService = {
  list: (productId) => apiClient.get(`/products/${productId}/reviews`),
}
```

5. **Hook** (`src/features/catalog/hooks/use-reviews.js`): `useQuery` con su
   `queryKey` estable (el prefijo se reutiliza para invalidar).
6. **UI**: consumir el hook dentro de `<QueryBoundary isLoading isError error
   onRetry>` y mostrar todo el texto con `t('…')`.
7. **Claves i18n** en `src/i18n/locales/{es,en}.js` (misma clave en los dos) y
   correr `npm run i18n:check`.

### Seed y persistencia

`src/mocks/db/` siembra el ER completo (`seed/`) y persiste en `localStorage`.
`resetDatabase()` vuelve al seed (lo usa `POST /dev/reset`). Los ids del seed
son estables (admin = 1, Ana = 2, cliente vacío = 3).

## Pasar a la API real

1. Definir `VITE_API_MODE=http` (y `VITE_API_BASE_URL` si no es `/api/v1`).
2. Ajustar los mapeos localizados en `src/api/services/*` si el contrato real
   difiere (snake_case, envelopes, paginación).
3. Nada más: `src/mocks/` **no entra al bundle** en modo http (SC-005). El
   import del transporte mock es dinámico y se elimina en el build; conviene
   repetir el chequeo barriendo `dist/` por marcadores (`mock-transport`).

Variables de entorno (ver `.env.example`, leídas en `src/config/env.js`):

| Variable | Default | Uso |
|---|---|---|
| `VITE_API_MODE` | `mock` | `mock` \| `http`. |
| `VITE_API_BASE_URL` | `/api/v1` | Base de la API real. |
| `VITE_MOCK_LATENCY_MS` | `250-600` | Latencia simulada (`0` la apaga). |
| `VITE_MOCK_FAIL_RATE` | `0` | Probabilidad de error del mock (0–1). |

## Convenciones

- **Aliases** (`vite.aliases.js`, replicados en `jsconfig.json`): `@api @app
  @assets @components @config @constants @features @hooks @i18n @mocks @pages
  @test @theme @utils`. No se usan rutas relativas que suban de nivel.
- **Archivos** kebab-case, **componentes** PascalCase.
- **i18n total**: ningún string visible se escribe literal en el código; todo
  pasa por `useI18n()` (`t`, `formatNumber/Date/Currency`).
- **Rutas en inglés** centralizadas en `src/app/routes.js`.
- **`src/mocks/**` sólo se importa desde `src/api/**` y desde `src/mocks/**`**
  (Biome lo verifica con `noRestrictedImports`).
- **Biome** es el único tool de lint y formato: `npm run lint` corre
  `biome check .` (corregir con `npx biome check --write .`).

## Tests

Vitest + jsdom + Testing Library (`src/test/setup.js`). Cubren controllers y
dominio del mock (contratos), utilidades y flujos de UI de punta a punta
(cliente y panel). Notas prácticas:

- Los `Select`/`Menu` de Mantine no abren de forma fiable en jsdom: los
  formularios usan `Radio.Group` para opciones cortas y los tests de menús
  consultan el DOM crudo.
- Los tests de componentes montan el router real (pesados): `testTimeout` es 20 s.
- `npm test` antes de cerrar cualquier cambio, más `npm run lint` y
  `npm run i18n:check`.

## PWA (instalable y offline)

La app se instala como PWA y navega sin conexión, con `vite-plugin-pwa`
(Workbox) configurado en `vite.config.js`:

- **Manifest** `manifest.webmanifest` generado desde la config (nombre, `standalone`,
  `theme_color`, idioma, `start_url`/`scope`) con los íconos de `public/`
  (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`).
  Son **placeholder** (Q-16: la marca real está pendiente); se regeneran con
  `powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1`.
- **Service worker** (`registerType: 'autoUpdate'`): precachea todo el build (shell +
  chunks de cada ruta + imágenes + fuentes), así que cualquier pantalla visitada —y de
  hecho todas, porque están precacheadas— funciona sin conexión. La navegación SPA
  offline se resuelve con el fallback a `index.html`.
- **API**: los `GET /api/` usan `NetworkFirst` (caché `vkfit-api-get`, 3 s de timeout,
  24 h de expiración) para poder mostrar los últimos datos vistos sin conexión; las
  escrituras **no** se cachean y las respuestas de `/api/` nunca se resuelven con el
  shell de la app. En modo `mock` no hay red: la app funciona offline por completo.
- **Sin push** y sin prompt de actualización: el SW se auto-actualiza
  (`skipWaiting` + `clientsClaim`). Si se quiere avisar de la versión nueva con un
  mensaje traducido, alcanza con cambiar a `registerType: 'prompt'` y usar
  `virtual:pwa-register/react`.

### Cómo probarla

```bash
npm run build && npm run preview        # el SW solo existe en el build
npm run preview -- --host              # instalarla desde el teléfono en la misma red
```

En `npm run dev` no hay service worker (a propósito: evita cachés viejas mientras se
itera). Con el `preview` andando, verificá en DevTools → *Application*: manifest, SW
activo, *Cache Storage* y el modo offline (Network → Offline + recargar).

**Pendiente en dispositivo físico**: `viewport-fit=cover` + safe-area insets. Hoy el
viewport es el estándar (`width=device-width, initial-scale=1`) para no meter el header
debajo del notch; al habilitarlo hay que sumar `env(safe-area-inset-*)` al
`AppShell.Header/Footer` y a los headers de la landing.

## Estado del prototipo

Historias US1–US12 implementadas (cliente y panel) sobre datos mock, más la PWA
instalable (Fase 14). Queda el **motor de recomendación real**
(`../../agents/context/recommendation-engine.txt`), que hoy devuelve un talle placeholder
desde `src/mocks/domain/size-engine.js`, y las preguntas abiertas del plan §9 sin cerrar
con el cliente/backend (Q-01 y Q-03 son las de mayor impacto).
