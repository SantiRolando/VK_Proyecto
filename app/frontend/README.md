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
| `npm run dev` | Servidor de desarrollo (modo mock por defecto; ver "Contra el backend"). |
| `npm run build` / `npm run preview` | Build de producción y servidor local del bundle. |
| `npm test` / `npm run test:watch` | Vitest + jsdom + Testing Library. |
| `npm run lint` / `npm run format` | Biome (lint + formato + imports restringidos). Es el único tool. |
| `npm run i18n:check` | Verifica paridad de claves entre `es` y `en`. |

### Contra el backend (modo `hybrid`)

El backend (`vk-scan-fit-be`, Spring Boot en `http://localhost:8080`) ya implementa
autenticación, motor de talle, historial, perfiles, direcciones y catálogo del
panel. Para usarlo:

```bash
cp .env.example .env
# en .env: VITE_API_MODE=hybrid
npm run dev
```

En `hybrid` las rutas que el backend implementa (`src/api/client/backend-coverage.js`)
salen por HTTP y el resto (stock, ventas, cupones, puntos, alertas, analítica,
usuarios) sigue en el mock, así la app se recorre completa mientras el backend
crece. El dev server reenvía `/api` al backend sin el prefijo (proxy en
`vite.config.js`), por eso no hay CORS. Con el perfil `dev,demo` del backend las
cuentas son `admin@vkfit.demo` y `ana.perez@vkfit.demo` (clave `Demo12345`).

Límites conocidos del modo híbrido, hasta que el backend sume esos módulos:

- El feedback de una generación sigue en el mock y no conoce las generaciones del
  backend: en híbrido la app oculta el botón de calificar.
- El catálogo del cliente, el checkout y el inventario siguen en el mock: no ven
  los productos creados en el backend, y una venta referencia direcciones del
  backend por id. La tabla de talles del mock copia la del backend (mismos ids),
  así que un `sizeId` vale en los dos lados.
- "Vincular a un cliente" en el modo asistente se oculta (el padrón es del mock).
- Las rutas del mock que piden sesión aceptan el JWT del backend (leen su payload
  sin verificar la firma) y usan el usuario mock con el mismo id y rol, o uno
  sintético.
- `/dev` (reset, entrar como usuario) solo afecta al mock.

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
  (`VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
  `CONFLICT`, `STOCK_INSUFFICIENT`, `NETWORK_ERROR`, `SERVER_ERROR`). `ErrorState`
  los traduce con `errors.<CODE>`. El backend responde `{ code, message, fields? }`
  y el transporte HTTP lo lleva a esa forma (`details.fields` trae el mensaje por
  campo de una `VALIDATION_ERROR`).
- **Sesión**: el backend entrega un access token (30 min) y un refresh token de un
  solo uso (30 días). `api-client` guarda los dos con el vencimiento (`session.js`)
  y renueva antes de un pedido si el access token venció (las rutas públicas
  tratan un token vencido como invitado) o tras un 401 `UNAUTHENTICATED`; una sola
  renovación en vuelo y un solo reintento. Solo un refresh token rechazado cierra
  la sesión; un corte de red la deja como está. Al entrar y al salir se rota el
  `guestSessionId` y se vacía la caché de TanStack Query. `logout` revoca el
  refresh token.
- **Vocabulario**: el backend escribe los enums en UPPER_SNAKE (`ENDURANCE`,
  `WITH_WARNING`) y el FE en PascalCase (`constants/enums.js`). La conversión vive
  en `src/api/wire.js` y la hacen los services (y los controllers mock, que hablan
  el mismo contrato). Las líneas son `Endurance | Soft | Jammer | Sunga` y el
  público `Adult | Kids`: "Kids" ya no es una línea.
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
   mapean DTOs (enums con los codecs de `src/api/wire.js`, paginación con
   `decodePage`). El controller mock debe responder con la misma forma que el
   backend, así el modo `hybrid` no nota la diferencia.

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

Los services ya hablan el contrato del backend. Cuando el backend sume un módulo:

1. Agregar sus rutas a `src/api/client/backend-coverage.js` (modo `hybrid`).
2. Ajustar el service si el contrato difiere del mock, y alinear el controller
   mock (o borrarlo cuando ya no haga falta).
3. Con todo cubierto, `VITE_API_MODE=http`: `src/mocks/` **no entra al bundle**
   (SC-005). El import del transporte mock es dinámico y se elimina en el build;
   conviene repetir el chequeo barriendo `dist/` por marcadores (`mock-transport`).

Variables de entorno (ver `.env.example`, leídas en `src/config/env.js`):

| Variable | Default | Uso |
|---|---|---|
| `VITE_API_MODE` | `mock` | `mock` \| `hybrid` \| `http`. |
| `VITE_API_BASE_URL` | `/api` | Prefijo que el dev server reenvía al backend. |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Destino del proxy (solo dev/preview). |
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
- **API**: solo los `GET /api/public/` usan `NetworkFirst` (caché `vkfit-api-get`, 3 s
  de timeout, 24 h de expiración) para poder mostrar la tabla de talles y el contacto
  sin conexión; lo que lleva sesión (perfiles, historial, panel) y las escrituras
  **no** se cachean, y las respuestas de `/api/` nunca se resuelven con el shell de la
  app. Cerrar sesión borra esa caché. En modo `mock` no hay red: la app funciona
  offline por completo.
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

Historias US1–US12 implementadas (cliente y panel), más la PWA instalable (Fase
14). Integrado con el backend (modo `hybrid`): autenticación con refresh token,
OTP por mail, motor de recomendación real (talle directo, con aviso o derivación
a atención personalizada), historial, perfiles, direcciones y catálogo del panel.
El mock sigue cubriendo stock, ventas, cupones, puntos, alertas, analítica y
usuarios hasta que el backend los implemente; `src/mocks/domain/size-engine.js`
replica el motor solo para la demo sin servidor.
