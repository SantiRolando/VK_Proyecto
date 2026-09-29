# Bug squash — Sesión #1

> Registro de la primera sesión de smoke testing manual y de los arreglos aplicados.
> Insumo para el backlog retroactivo (Fase 3).

- **Fecha:** 2026-09-28
- **Entorno:** DEV (`npm run dev`), <http://localhost:5173/>, modo mock
- **Alcance probado:** entry point, navegación, acceso al panel admin, topbar
- **Estado:** los tres hallazgos resueltos y verificados

---

## Resumen

| # | Hallazgo | Tipo | Estado |
|---|---|---|---|
| F1 | La raíz `/` mostraba una pantalla intermedia; el entry point debe ser la landing | Bug de rutas | ✅ Resuelto |
| F2 | No había forma visible de llegar al panel admin | Gap de descubribilidad | ✅ Resuelto |
| F3 | Topbar: falta de aire en branding y menú; navegación móvil poco flexible | Mejora de UI | ✅ Resuelto |
| F4 | Las rutas inexistentes mostraban un stub genérico | Mejora de UX | ✅ Resuelto |
| F5 | "La página por defecto no es la landing" | **No reproducido en código** — caché del navegador | ⚠️ Ver F5 |
| F6 | Primario azul; sin modo oscuro ni selector de tema | Sistema de diseño | ✅ Resuelto |
| F7 | Los ítems del menú hamburguesa cambiaban según la ruta | Consistencia de navegación | ✅ Resuelto |

---

## F6 — Primario monocromo y selector de tema (claro / oscuro / sistema)

**Qué pidió el usuario:** el primario debía ser negro en tema claro y blanco en tema
oscuro; agregar un selector claro–oscuro–sistema; y no definir colores propios: usar las
paletas base de Mantine/Tailwind, reservando el color para lo semántico (positivo →
verde, negativo/destructivo → rojo, advertencia → amarillo).

**El obstáculo real:** Mantine deriva `--mantine-primary-color-*` de **una sola** paleta
(`theme.primaryColor`), así que no puede invertir el primario por esquema. Tampoco alcanza
con cambiar `primaryColor`: había **48 usos explícitos de `color="vikinga"` en 34
archivos** que no siguen al primario.

**Solución:**

- `theme.js`: se elimina la paleta `vikinga`. `primaryColor: 'gray'` (near-black). **Sin
  colores propios**: todo sale de paletas base de Mantine.
- `theme/theme.css` (nuevo): el resolver de Mantine emite bloques separados por esquema,
  así que ahí se sobrescriben los tokens del primario — `gray-9/8` en claro, la rampa
  `dark` (`dark-0/1`) en oscuro, vía `[data-mantine-color-scheme]`. Es una inversión real:
  el botón primario es oscuro en claro y claro en oscuro, y Mantine calcula el color de
  texto de contraste por esquema.
- `components/theme-picker.jsx` (nuevo): `SegmentedControl` con claro / oscuro / sistema,
  persistido por Mantine. Se monta en el header del cliente, en el del panel y en el
  drawer. Los tres íconos llevan `aria-label` traducido.
- `providers.jsx`: `defaultColorScheme="auto"` (sigue `prefers-color-scheme`) e importa
  `theme.css`.
- **Reemplazo semántico de los 48 usos** (26 ediciones): primario monocromo donde es
  identidad (talle dominante, talle elegido, badge de producto, gráfico de conversión);
  azul donde es informativo (alertas de checkout, badges de línea/perfil/historial,
  mapa de calor de talles faltantes); verde donde es positivo o confirma (perfil activo,
  cupón aplicado, movimiento de stock, precisión del talle); rojo donde es destructivo
  (ya estaba); amarillo para recompensas (ícono de puntos).
- `--vk-accent` en `theme.css`: azul fijo para superficies donde el monocromo no alcanza
  (series de gráfico, heatmap). Sin colores inventados: es `blue-6` de Mantine.

**Verificación:** los tokens sobreviven al bundle (`--mantine-primary-color-filled`,
`--vk-accent`, el bloque de esquema oscuro y `vk-scrim` aparecen en el CSS construido).

### Fondo de pileta en las pantallas de autenticación

**Qué pidió el usuario:** reutilizar la imagen de pileta como fondo del login.

**Implementación:** en `features/auth/auth-shell.jsx`, que es el contenedor **común** de
login, registro, OTP, olvidé mi contraseña y reset. Se reutiliza
`@assets/indoor-swimming-pool.jpg` (294 kB), el mismo que el hero de la landing, así que no
entra ningún asset nuevo — y como ya lo precachea la PWA, tampoco cambia el peso del
precache.

Por qué en el shell y no solo en el login: el pedido mencionaba el login, pero las cinco
pantallas comparten el shell. Ponerlo en el shell es una línea, las mantiene consistentes y
evita un caso especial. **Si se prefiere solo en el login, es mover el fondo del shell a
`login-page.jsx`.**

Contraste: sobre la foto van un velo `bg-black/45` y una superficie con desenfoque
(`.vk-scrim`, en `theme/auth.css`, porque Tailwind v4 no trae utilidades de
`backdrop-filter`), de modo que la legibilidad no depende de que la imagen sea clara u
oscura en esa zona. Ambos elementos llevan `aria-hidden`.

---

## F7 — El menú hamburguesa ya no cambia según la ruta

**Qué reportó el usuario:** los ítems del menú cambiaban según dónde estuviera parado;
deberían ser siempre los mismos, y si son muchos, usar ítems y sub-ítems.

**Qué pasaba:** la lista principal era estable (Medir, Catálogo, Historial, Cuenta), pero
la sección de administración aparecía y desaparecía según la ruta, y el estado activo se
calculaba por igualdad exacta de path, así que una ruta hija (`/admin/sales/7`) no marcaba
su ítem padre.

**Solución (opción elegida por el usuario: sub-ítems del panel siempre visibles para un
admin):**

- La lista principal son **siempre los mismos cuatro ítems**, sin importar la ruta.
- Si el usuario es admin, se agrega una sección **Panel** con los **10 sub-ítems**
  completos (Panel, Ventas, Inventario, Movimientos, Productos, Talles faltantes,
  Comentarios, Cupones, Reglas, Para terceros), indentados, sin importar en qué pantalla
  esté. Es la misma lista que la barra lateral de `admin-layout`, así que el drawer navega
  todo el panel por sí solo.
- El estado activo pasa a resolverse por prefijo (`isActive`), así que las rutas hijas
  marcan su ítem padre.
- El ítem activo usa el primario del esquema en lugar de un azul fijo.
- Claves i18n nuevas: `nav.panelSection` (encabezado de la sección) y `theme.*` para el
  selector de tema.


---

## F5 — "La página por defecto no es la landing" (no reproducido en el código)

**Qué reportó el usuario:** al entrar a `http://localhost:5173/` la página por defecto no es
la landing.

**Qué dice el código (verificado):**

- `src/app/routes.js`: `home: '/'`.
- `src/app/router.jsx` línea 201: `<Route path={routes.home} element={<LandingPage />} />`.
- `src/main.jsx` → `src/app/app.jsx` → `AppRouter`, sin redirección de arranque.
- No hay ningún `<Navigate>` que saque al usuario de `/`: los únicos son los guards
  `RequireAuth` (a login) y `RequireRole` / `GuestOnly` (a `/account`), y ninguno envuelve
  la ruta de la landing.
- El dev server **sí** está sirviendo el código nuevo: `GET http://localhost:5173/`
  devuelve `index.html` con `<script src="/src/main.jsx">` (código fuente en vivo, no un
  bundle viejo).

**Causa más probable: service worker con precache viejo.** Es una PWA con
`vite-plugin-pwa` y `registerType: 'autoUpdate'`. Si el navegador registró el SW de un
build anterior, sirve el `index.html` precacheado —y con él el bundle viejo, donde `/` era
`HomePage`. **Hacer un build no lo arregla**: `dist/` se regenera, pero el navegador sigue
con el SW activo. `npm run build` se ejecutó dos veces en esta sesión, así que hay un
`sw.js` nuevo en `dist/` que el navegador todavía no adoptó.

**Cómo confirmarlo y arreglarlo (DevTools → Application):**

1. *Service Workers*: si hay uno activo en `localhost:5173`, esa es la causa.
2. *Storage* → **Clear site data** (o "Unregister" en Service Workers).
3. Recargar con Ctrl+Shift+R.

Alternativa por consola, en la pestaña del dev server:

```js
const rs = await navigator.serviceWorker.getRegistrations()
rs.forEach((r) => r.unregister())
caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)))
location.reload()
```

**Pendiente de confirmar por el usuario.** Si tras limpiar el SW la raíz sigue sin mostrar
la landing, entonces hay algo que no estoy viendo y hace falta el detalle de la consola.

---

## F4 — Página 404 real

**Problema:** cualquier ruta inexistente caía en `StubPage`, un placeholder genérico que
solo mostraba el título y el aviso de "próximamente" — el mismo componente que usan las
pantallas todavía no implementadas.

**Solución aplicada:** nuevo `src/components/not-found-page.jsx`.

- Código **404** grande en rojo (`red.7`), con tamaño fluido
  (`clamp(4rem, 15vw, 7rem)`).
- Ícono de advertencia `IconAlertTriangle` en `red.6`, marcado `aria-hidden`.
- Todo el bloque centrado (`Stack align="center"` + `text-center`).
- Título y cuerpo traducidos desde las claves existentes `notFound.title` y
  `notFound.body`, más una nueva `notFound.backHome` con botón de vuelta al inicio.
- `router.jsx`: la ruta `path="*"` pasa de `StubPage` a `NotFoundPage`.

**Test agregado:** `src/test/not-found.test.jsx` (2 casos) verifica el código 404, el
título, el aviso y que el botón apunte a `/`. Monta con el `Providers` real del proyecto
(i18n + Mantine); con solo `I18nProvider` falla porque Mantine necesita su propio provider.


---

## F1 — La landing ahora es el entry point

**Problema:** `/` servía `home-page.jsx` (tres botones: Medir / Ver historial / Mi cuenta)
mientras que la landing real estaba en `/about`.

**Solución aplicada:**

- `routes.js`: `home: '/'` (landing) y se retira `about`. Se agrega `account: '/account'`.
- `router.jsx`: `/` renderiza `LandingPage`; se elimina la ruta `/about` y la pantalla
  `home-page` se retira del repo.
- **Detalle que obligó a un cambio extra:** `routes.home` se usaba como destino
  post-login y post-logout del cliente. Con `/` siendo la landing, desloguearse habría
  dejado al cliente en la página de marketing. Por eso se agregó `routes.account`, que
  renderiza el historial del cliente, y se repuntaron: guard `RequireRole`, guard
  `GuestOnly`, login, OTP, registro, logout del cliente y logout del admin.
- i18n: se retiraron las 11 claves `home.*` (ya sin uso) en es y en.

**Verificación:** 0 referencias a `routes.about` o `HomePage` en `src/`.

> Decisión abierta para el usuario: `/account` se resolvió como el **historial** del
> cliente. Si se prefiere otra pantalla como destino (por ejemplo un resumen de cuenta),
> es un cambio de una línea en `router.jsx`.

---

## F2 — Acceso visible al panel para el rol Admin

**Problema:** las 11 rutas admin existían bajo `RequireRole requiredRole="Admin"`, pero
no había ningún enlace hacia ellas: ni en la nav del cliente, ni en el menú de cuenta, ni
en la barra móvil. Solo se llegaba escribiendo `/admin` a mano.

**Solución aplicada:** entrada al panel visible **solo para rol Admin**, en dos lugares:

- Menú de cuenta del header (`Panel de administración`), con `IconLayoutDashboard`.
- Drawer móvil, como ítem adicional de la navegación.

Se conserva el guard: un cliente que escriba `/admin` sigue siendo redirigido.

**Nota:** al entrar con una cuenta de cliente el panel no aparece a propósito. Las
credenciales demo están en `src/mocks/db/seed/users.js`:

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@vikinga.test` | `admin123` |
| Cliente (Ana, 120 puntos) | `ana@example.test` | `cliente123` |
| Cliente nuevo | `nuevo@example.test` | `cliente123` |

---

## F3 — Topbar y navegación móvil

**Problema:** poco espacio entre branding y menú, y entre los ítems del menú. En móvil la
navegación era una barra inferior fija de 60 px, sin lugar para crecer.

**Solución aplicada (decisión del usuario: reemplazo total de la barra inferior):**

- Se elimina el `AppShell.Footer` y su `footer={{ height: 60 }}`.
- Se agrega `Burger` + `Drawer` de Mantine (mismo patrón que ya usaba `admin-layout.jsx`:
  `useDisclosure` + `hiddenFrom="sm"`).
- El drawer incluye los 4 ítems de navegación, el acceso al panel si el rol es Admin y el
  selector de perfil. Se cierra al navegar (`onNavigate={close}`) y con `Esc`/overlay.
- Desktop: más aire — separación branding/menú de `md` a `lg`, ítems de menú de `xs` a
  `md`, y padding de cada ítem de `px-2 py-1` a `px-3 py-1.5`.
- Accesibilidad: `Burger` con `aria-label` traducido (`nav.menu`) y `Drawer` con
  `closeButtonProps` traducido (`common.close`), siguiendo el patrón de F13.
- i18n: nueva clave `nav.admin` en es y en. Se retiró el prop `vertical` de
  `CustomerNavItem`, que quedó sin uso al desaparecer la barra inferior.

**Efecto colateral positivo:** el drawer libera los 60 px que ocupaba la barra inferior y
elimina el riesgo de desborde horizontal a 360 px, que era la razón por la que el header
se había compactado en F13. Igual conviene revalidar 360/768/1280 px.

---

## Verificación ejecutada

| Chequeo | Resultado |
|---|---|
| `biome check .` | ✅ 255 archivos, 0 errores |
| `npm test` | ✅ **263 tests, 44 archivos** (261 previos + 2 del selector de tema) |
| `npm run i18n:check` | ✅ paridad es/en en **544 claves** |
| `npm run build` | ✅ compila; tokens de tema presentes en el CSS construido |

Nota: el aviso de chunks >500 kB en el build es preexistente (recharts en su propio
chunk), no lo introdujo este cambio.

---

## Hallazgos menores observados y no tocados

- El header de la landing (`site-header.jsx`) es independiente del header del cliente y no
  se tocó: sigue con marca a la izquierda, anclas al centro e idioma a la derecha.
- El comentario de cabecera de `customer-layout.jsx` todavía describía la barra inferior
  eliminada; se actualizó al drawer.

## Próximo paso

Fase 2 (podar ruido, pulir textos y requisitos) y después Fase 3 (backlog retroactivo en
Jira).

---

## F8 — `/account` devolvía 404 (bug real, reproducido en test)

**Qué reportó el usuario:** después del login caía en `/account` y veía un 404.

**Causa raíz:** el layout autenticado del cliente es una ruta **sin `path`**, y el `index`
de una ruta sin path matchea la ruta del **padre** (o sea `/`), no `/account`. Como no había
ninguna ruta con path `/account`, la URL caía en el catch-all (`path="*"`) y renderizaba la
página 404. Es decir: el `index` no hacía lo que parecía.

**Reproducción:** `src/test/account-route.test.jsx` fallaba con `404` en pantalla antes del
arreglo. Se escribió antes de tocar el código, a propósito.

**Solución:** `routes.account` apunta a una ruta con path real (`/account/overview`) y se
agrega `routes.accountRoot` (`/account`) solo como namespace. Como todos los redirects usan
el símbolo `routes.account`, el cambio se propaga solo: guards, login, OTP, registro y los
dos logout.

**Test de regresión:** 3 casos — el destino renderiza el historial, `routes.account` no es
la raíz del namespace, y un path inexistente bajo `/account` **sí** muestra el 404 (para que
el catch-all siga funcionando).

---

## F9 — Feedback de UI en móvil (puntos 2, 4, 5 y 6)

### 2. Indicador de página actual

El ítem activo se marcaba solo con peso de fuente, imperceptible. Ahora el ítem del header
lleva **subrayado** (`box-shadow: inset 0 -2px 0 0 …`) además del color, y el activo se
resuelve **por prefijo** (`isNavItemActive`), así que una ruta hija marca su ítem padre.

### 4. Botones primarios en tema oscuro

Hubo dos intentos fallidos antes del bueno, y conviene dejarlos registrados:

1. **Relleno casi blanco con texto oscuro (invertido).** Se leía mal sobre el fondo oscuro;
   el botón parecía deshabilitado.
2. **Relleno oscuro apenas más claro que el fondo.** Contraste insuficiente: el botón se
   perdía contra el fondo. Reportado por el usuario.

**Solución final:** relleno **blanco con texto negro** en oscuro, que es la inversión
correcta. En claro se mantiene casi negro con texto blanco.

| token | claro | oscuro |
|---|---|---|
| relleno | `gray-9` `#212529` | `white` `#FFFFFF` |
| relleno hover | `gray-7` `#495057` | `gray-3` `#DEE2E6` |
| texto | blanco | negro |

**Ratios medidos** (`contrast-report.mjs`, fórmula WCAG):

| | claro | oscuro |
|---|---|---|
| texto sobre relleno | 15.43:1 ✅ | 21.00:1 ✅ |
| relleno contra la página | 15.43:1 ✅ | 17.22:1 ✅ |
| hover contra la página | 8.18:1 ✅ | 13.22:1 ✅ |
| texto sobre hover | 8.18:1 ✅ | 16.13:1 ✅ |

El medidor encontró un problema que se habría enviado: el hover de claro era `gray-6`
(#868E96) y con texto blanco daba **3.32:1**, por debajo de AA. Se cambió a `gray-7`
(7.56:1). Sin esta medición el defecto pasaba desapercibido.

### Ítems de navegación con más contraste (oscuro)

Los ítems inactivos usaban `dimmed`, que en oscuro no se lee sobre el fondo. Ahora usan
`--mantine-color-text` (color de texto normal) y en oscuro se sube además
`--mantine-color-dimmed` a `dark-1`, lo que también mejora los textos secundarios de toda
la app.


### 5. Drawer del menú hamburguesa

- El **selector de tema pasó a la cabecera del drawer**, inmediatamente después de la marca,
  en una barra fija que no scrollea (`withCloseButton: false` + cabecera propia).
- Los ítems eran demasiado chicos: ahora usan el mismo `NavLink` de Mantine que la barra
  lateral del panel, con etiqueta en `--mantine-font-size-sm`.
- Panel y sitio comparten el mismo tratamiento visual: un solo componente de ítem, con
  encabezado de sección (`nav.panelSection`) en lugar de dos estilos distintos.

### 6. Barra lateral del panel

Se mantiene tal cual (es la que le gusta al usuario) y se le agregó el **grupo de ítems
genéricos del sitio** (Medir, Catálogo, Historial, Cuenta) arriba, separado por un divisor
con encabezado, para que un admin navegue la parte pública sin salir del panel.

**Refactor que lo habilita:** `src/config/navigation.js` centraliza
`CUSTOMER_NAV_ITEMS`, `PANEL_NAV_ITEMS` e `isNavItemActive`, así que el drawer y la barra
lateral no pueden desincronizarse (antes cada layout tenía su propia copia de la lista).

---

## F11 — Sidebar permanente, unificación del asistente y rename a "Analíticas"

### Layout único con barra lateral siempre visible

**Qué pidió el usuario:** sacar los ítems de menú del topbar y dejar una barra
lateral **siempre visible en desktop**, colapsable en móvil (como la del panel), para
tener todas las opciones a un clic desde cualquier pantalla.

**Antes había dos layouts** (`customer-layout` y `admin-layout`) con navegaciones y
estéticas distintas. Ahora hay **uno solo**, `components/layout/app-shell-layout.jsx`:

- `AppShell` con `navbar` a 260 px, `breakpoint: 'sm'`, colapsado solo en móvil.
- El header queda con marca, selector de perfil, tema, menú de cuenta e idioma.
- La misma navegación se usa en la barra lateral fija y en el drawer de móvil: un solo
  cuerpo de JSX, así no pueden divergir.
- Un admin ve además el grupo **Panel** y el pie con su nombre y logout.

Se eliminaron `customer-layout.jsx` y `admin-layout.jsx`.

### El modo asistente deja de ser una ruta propia

`/admin/assistant` era el mismo `FitForm` con un switch "para terceros" y un vínculo
opcional a un cliente: no justificaba una pantalla aparte. Ahora esos controles viven
**dentro de `/fit`** y aparecen **solo si el usuario es admin**.

- `routes.adminAssistant` eliminada, junto con `assistant-page.jsx` y su ítem de menú.
- `useCustomers` acepta `{ enabled }` para no disparar la consulta de admin cuando la
  pantalla la usa un cliente común.
- Claves i18n `nav.assistant`, `admin.assistant.title` y `admin.assistant.subtitle`
  retiradas; se conservan las de los controles.

**Tests:** `src/test/fit-staff-controls.test.jsx` (3 casos) verifica que un admin ve el
switch, que un cliente **no** ve ningún control de personal, y que `/admin/assistant`
ahora da 404.

### "Panel de control" pasa a "Analíticas"

`nav.dashboard` → `nav.analytics`: **"Analíticas"** en es, **"Analytics"** en en. El ítem
era "Panel", demasiado genérico. Ícono `IconLayoutDashboard` → `IconChartHistogram`, que
representa la naturaleza analítica de la pantalla.

---

## F12 — Texto del botón primario en tema oscuro (causa real: `autoContrast`)

**Reporte del usuario:** el texto seguía sin tener contraste suficiente en oscuro.

**Causa raíz, encontrada leyendo Mantine:** `getContrastColor` corta temprano y devuelve
`var(--mantine-color-white)` **siempre**, salvo que `theme.autoContrast` esté activo. Con
el relleno blanco del tema oscuro, eso daba **texto blanco sobre fondo blanco**.

Dos sub-problemas, resueltos por separado:

1. **El token del documento.** Se activó `theme.autoContrast: true`, que deduce el color
   de la luminancia. Además, el relleno de tema claro pasó a **negro puro**: `autoContrast`
   calcula sobre el shade del tema (`gray-6`), no sobre la variable de relleno, así que un
   relleno "casi negro" con shade gris daba texto negro sobre negro.
2. **El valor inline del botón.** Mantine escribe `--button-color` **inline** en cada
   botón, y un custom property inline le gana a cualquier hoja de estilos. `autoContrast`
   no lo toca. Se pisa desde `theme/theme.css` con `!important` (los custom properties sí
   lo aceptan), con `biome-ignore` justificado.

**Ratios medidos** (`contrast-report.mjs`), todos por encima de AA:

| | claro | oscuro |
|---|---|---|
| texto sobre relleno | 21.00:1 ✅ | 21.00:1 ✅ |
| relleno contra la página | 21.00:1 ✅ | 17.22:1 ✅ |
| hover contra la página | 8.18:1 ✅ | 13.22:1 ✅ |
| texto sobre hover | 8.18:1 ✅ | 16.13:1 ✅ |

El hover del tema claro se ajustó de `gray-6` a `gray-7`: con texto blanco, `gray-6` daba
3.32:1 y no pasaba AA para texto normal. `gray-7` da 8.18:1 y sigue siendo visiblemente más
claro que el relleno negro.

### Limitación de verificación documentada

El color del texto del botón **no se puede testear en jsdom**: Mantine lo fija en un
custom property inline y jsdom no resuelve custom properties ni aplica `@layer` /
`!important` sobre ellos (`getComputedStyle` devuelve `backgroundColor: rgba(0,0,0,0)` y un
`color` que no sigue al token). Se verificó con un diagnóstico desechable. La cobertura
real es el CSS construido (que muestra `--button-color: … !important` para ambos esquemas)
más `contrast-report.mjs`. El test de tokens lo deja anotado en un comentario.

---

## F13 — Catálogo navegable sin talle

**Qué pidió el usuario:** poder ver productos aunque no haya talle elegido, avisando que
la experiencia mejora eligiéndolo.

**Antes:** el controller devolvía **422** sin `sizeId` y la pantalla mostraba solo el
estado bloqueante "primero medí tu talle".

**Ahora:** sin `sizeId` se listan los productos activos de la línea (sin filtrar por
disponibilidad) y el `meta` devuelve `hasStock: null`, que es lo que el FE usa para saber
que no hubo filtro de talle. La pantalla muestra un `Alert` informativo —"Mejor con tu
talle"— con un CTA a medir, y encima el listado completo.

**Cambios:** `catalog.controller.js` (la rama sin `sizeId`), `catalog-page.jsx` (el aviso
y el listado; se retiró `NeedSizeState`), claves i18n `catalog.noSize.*`, y el test que
afirmaba el 422 se reemplazó por dos casos que verifican el listado completo y el respeto
del filtro de línea. Se agregó `src/test/catalog-no-size.test.jsx`.

---

## F14 — Feedback: modal en desktop, drawer en móvil

El drawer desde abajo es cómodo en móvil (zona del pulgar), pero en desktop una hoja
pegada al borde inferior se lee peor que un modal centrado. `feedback-drawer.jsx` ahora
elige el contenedor con `useMediaQuery('(min-width: 48em)')`: `Modal centered` en desktop,
`Drawer position="bottom"` en móvil. El cuerpo es el mismo JSX, extraído a una variable,
así los dos contenedores no pueden divergir.

> En jsdom `useMediaQuery` devuelve `false`, así que los tests siguen ejercitando el
> drawer. La rama de modal no está cubierta por tests: se verifica a ojo en el navegador.

---

## F15 — El primario pasa a azul (fin del monocromo)

**Decisión del usuario, con razón:** tras tres intentos fallidos del primario monocromo,
pidió cambiar los botones al color por defecto o a un tono de azul.

**Causa raíz exacta, leída en `default-variant-colors-resolver.mjs`:**

```js
const textColor = _autoContrast
  ? (parsed.isLight ? 'var(--mantine-color-black)' : 'var(--mantine-color-white)')
  : 'var(--mantine-color-white)'
```

`parsed` sale del **shade del tema** (`gray-6`), mientras que el **fondo pintado** salía de
un override en CSS (`--mantine-primary-color-filled`). Son dos caminos distintos de
resolución: en tema oscuro el shade era claro pero el relleno pintado era blanco, así que
elegía texto blanco sobre blanco.

El arreglo del tema claro (relleno negro puro) funcionó **por coincidencia**: hizo que el
shade del tema y el relleno pintado coincidieran en luminancia. Enderezar eso para los dos
esquemas exigía que la paleta cambiara por esquema, y `theme.primaryColor` es una sola
paleta.

**Solución:** `primaryColor: 'blue'`, sin overrides. El shade del tema y el relleno pintado
son el mismo color y Mantine resuelve el contraste solo en ambos esquemas. Se retiró el
override de `--button-color` de `theme.css` (y su `!important`).

**Test de regresión** (`theme-tokens.test.jsx`): fija `primaryColor === 'blue'`,
`autoContrast === true`, y —lo más importante— que el resolver **no** vuelva a definir
`--mantine-primary-color-filled` ni `--mantine-primary-color-contrast`. Ese es el cambio que
reintroduce el bug.

**Contraste medido** (`contrast-report.mjs`): texto blanco sobre `blue-6` da **3.56:1**.

> 3.56:1 **no alcanza AA para texto normal** (4.5:1), sí para texto grande y componentes de
> UI. Es el azul por defecto de Mantine y el compromiso aceptado. Si se quiere AA estricto,
> el candidato medido es `blue-7` (#1C7ED6, 4.20:1 — todavía por debajo) o `blue-8`
> (#1864AB, 6.09:1), pero `blue-8` cae a **2.83:1 contra el fondo oscuro** y se pierde el
> botón. Es decir: con la paleta base de Mantine no hay un azul que pase AA estricto en
> texto normal y siga destacándose sobre el fondo oscuro. Queda como decisión consciente.

**Si alguna vez se retoma el primario monocromo**, el camino correcto es un
`virtualColor` como `primaryColor`, con una rampa clara en `light` y una oscura en `dark`.
Así el shade del tema **sí** cambia por esquema, el color pintado y el que lee el resolver
vuelven a ser el mismo, y `autoContrast` acierta. Lo que **no** funciona es un
`primaryColor` fijo con el relleno pisado por CSS, que es lo que se intentó tres veces.

**Limpieza:** se retiró el override `!important` de `--button-color`; `theme.css` queda solo
con `color-scheme`.

---

## F10 — Comando para levantar dev sin caché

```powershell
npm run dev -- --force
```

`--force` hace que Vite ignore su caché de dependencias pre-empaquetadas
(`node_modules/.vite`). **No** limpia el service worker: si el navegador tiene uno
registrado de un build de producción, hay que limpiarlo aparte (DevTools → Application →
Clear site data). Para el caso completo:

```powershell
npm run dev -- --force
```

y en la consola del navegador:

```js
const rs = await navigator.serviceWorker.getRegistrations()
rs.forEach(r => r.unregister())
const ks = await caches.keys()
await Promise.all(ks.map(k => caches.delete(k)))
location.reload()
```


---

## F16 — Información de cuenta y avatar unificado

**Respuesta a la pregunta del usuario:** no, no existía ninguna pantalla para ver los datos
de la cuenta. Los datos estaban disponibles en `authService.me()` (`/auth/me`) pero ninguna
pantalla los consumía. Además, el header tenía **dos controles que se pisaban**: el menú de
cuenta (nombre) y el selector de perfil.

### Pantalla nueva: `/account/info`

Una sola pantalla con dos pestañas, con el estado en la URL (`?tab=agenda`), así que es
enlazable y sobrevive al refresh:

- **Cuenta**: nombre, tipo de usuario, email y WhatsApp (los datos de `/auth/me`).
- **Perfiles y direcciones**: la agenda completa, que antes vivía en dos rutas separadas.

**Refactor que lo habilita:** `profiles-page.jsx` y `addresses-page.jsx` se partieron en
`Page` (envoltorio de ruta: `Container` + `PageHeader`) y `Body` (contenido). Embeber las
páginas enteras habría anidado contenedores y duplicado encabezados. Los `Body` son
componentes de nivel de módulo —no funciones inline— para que el estado local no se remonte
en cada render.

**Rutas viejas:** `/account/profiles` y `/account/addresses` ahora **redirigen** a
`/account/info?tab=agenda`, para no romper enlaces ni marcadores.

### Avatar de cuenta

`components/account-avatar-menu.jsx` reemplaza los dos controles por uno, al estilo del
botón de cuenta de Google: iniciales en un `Avatar`, y al abrir —identidad, **perfil activo
con cambio rápido**, enlaces a cuenta / historial / compras, panel si es admin, y logout—.

- **Desktop**: en el header.
- **Móvil**: fijo arriba del drawer, junto al selector de tema.
- Se eliminó `components/profile-selector.jsx` (quedó sin uso) y el `LogoutButton` del pie
  de la barra lateral, que el avatar ahora cubre.

El ítem de navegación "Cuenta" apunta a `/account/info` (antes iba a los perfiles).

**Test actualizado:** `profiles-addresses.test.jsx` clickeaba un botón "Training" que ya no
existe; ahora abre el menú del avatar (`name: 'Cuenta'`) y cambia el perfil desde ahí.

### Bug introducido y corregido en el momento

Al extraer `LogoutButton` de `app-shell-layout.jsx` quité `Divider` del import, pero la
navegación lo seguía usando: `ReferenceError: Divider is not defined`. Rompía **todo** lo
que renderiza el layout — fallaron 14 tests de admin de golpe. Se detectó en la primera
corrida y se corrigió antes de seguir.

**Verificación:** `biome check` ✅ (260 archivos), **281 tests** ✅ (48 archivos),
`i18n:check` ✅ (553 claves), build ✅.

---

## F17 — Unificación de rótulos del panel

Había **tres rótulos para lo mismo**: `nav.panelSection` ("Panel"),
`admin.dashboard.title` ("Panel de control") y `nav.admin` ("Panel de
administración"). Se unificó al más claro, que es el que eligió el usuario:

| Dónde | Antes | Ahora |
|---|---|---|
| Encabezado de sección (barra lateral y drawer) | Panel | **Panel de administración** |
| Título de la pantalla de analíticas | Panel de control | **Panel de administración** |
| Enlace del avatar | Panel de administración | **Panel de administración** |

Se conserva `nav.analytics` ("Analíticas") para el ítem de la pantalla dentro de la
sección, que es más específico y no se pisa con el encabezado. `app.admin`
("Administración") queda como sufijo de la marca en el header, que es una función distinta.

En inglés: `Management panel` para los tres, `Analytics` para el ítem.

---

## F18 — Pantalla de usuarios del panel

**Qué pidió el usuario:** una pantalla para ver todas las cuentas de la plataforma, otorgar
o revocar el rol de administrador, e indicadores de uso (activos ahora, últimos 30 días,
altas).

### Datos

El controller `admin-customers.controller.js` solo listaba clientes para el modo asistente.
Se sumaron tres endpoints, todos con `auth: 'admin'`:

| Endpoint | Para qué |
|---|---|
| `GET /admin/users` | Padrón completo con filtro por rol y por actividad |
| `GET /admin/users/analytics` | Indicadores + tendencia de altas por mes |
| `PATCH /admin/users/:id/role` | Otorgar o revocar admin |

**Alcance declarado, no inventado:** no existe tabla de sesiones en el mock, así que
"usuarios activos" se deriva de la **última medición o compra** (`sizeGenerations`,
`sales`). Mide uso del producto, no inicios de sesión — está documentado en el controller y
en la UI para que nadie lea el número como logins.

### Salvaguardas del cambio de rol

- No se puede degradar al **último** administrador (`LAST_ADMIN`, 409): el panel quedaría
  sin acceso.
- No se puede **auto-degradar** (`CANNOT_DEMOTE_SELF`, 409). El botón de la propia fila
  queda deshabilitado con un `title` explicativo.

### Seed ampliado

Con 3 usuarios sembrados, el padrón y el gráfico quedaban vacíos. Se agregó un padrón de
demostración **determinista** (PRNG con semilla) de ~33 cuentas repartidas en 12 meses, más
dos cuentas de personal, para que la tendencia tenga forma y el filtro por rol tenga con
qué demostrarse. Los tres primeros usuarios quedan intactos: sus credenciales están
documentadas y otros tests dependen de ellas (Ana y su historial).

### UI

Cuatro tarjetas de indicador (cuentas totales con desglose admin/cliente, **activos 30
días** con tasa, **altas 30 días** con variación contra el período anterior, y cuentas con
acceso al panel), un gráfico de barras de altas por mes y el padrón en tabla con filtros por
rol y por actividad, y la acción de rol por fila.

El gráfico se carga con `import()` en su propio chunk, igual que en el dashboard, para que
`recharts` no entre al bundle de arranque.

### Bugs propios detectados y corregidos en el momento

1. **`ApiError` importado de `@mocks/router/mock-router.js`.** Ese módulo no lo exporta; el
   error solo se dispara en las ramas de error, así que habría pasado los caminos felices y
   explotado recién al rechazar un rol inválido. Lo detectó el test. El import correcto es
   `@api/client/api-error.js`, como en el resto de los controllers.
2. **Archivo de seed truncado.** Al reescribir `users.js` se perdió el final del archivo
   (`measurementProfiles`, `addresses` y el `buildIdentity`), que Biome señaló como variable
   sin usar y error de parseo. Se reescribió completo.
3. **Test de `/dev/reset` que fijaba 3 usuarios.** Se cambió por una aserción de identidad:
   ensucia la base y verifica que el reset la devuelve al estado sembrado, sin depender de un
   número fijo de filas.

### Verificación

`biome check` ✅ (264 archivos), **290 tests** ✅ (49 archivos), `i18n:check` ✅ (588 claves),
build ✅.

---

## F19 — La barra del gráfico era negra por un token inválido

**Qué pidió el usuario:** que la barra del dashboard use el azul primario.

**Lo que creía:** que la barra era negra porque el primario *era* gris, y que al pasar el
primario a azul se arreglaba solo. **Estaba equivocado**, y el chequeo lo desmintió.

**Causa real:** el gráfico declaraba `color: 'primary'`. `@mantine/charts` resuelve el color
de cada serie con `getThemeColor(color, theme)` y lo asigna directo a `fill`. Y
`getThemeColor('primary', theme)` **devuelve la cadena `'primary'` tal cual**, porque no es
una clave de paleta. El SVG terminaba con `fill="primary"`, que no es un color CSS válido,
así que el navegador caía al negro por defecto. La barra habría seguido negra con cualquier
primario.

**Arreglo:** `CHART_ACCENT = 'blue.6'` exportado desde `theme/theme.js` y usado por los dos
gráficos (dashboard y usuarios), para que no se desincronicen. `getThemeColor` sí acepta la
forma `paleta.shade` y la resuelve a `var(--mantine-color-blue-6)`.

Verificado: `blue.6` presente en los tres chunks construidos y **ninguna** ocurrencia
restante de `color: 'primary'`.

## F20 — Rótulo "Padrón" poco claro

El usuario no entendía qué era el "Padrón". Es jerga administrativa para *registro de
personas*. Se reemplazó por lo que la tabla realmente muestra:

| Clave | Antes | Ahora |
|---|---|---|
| `admin.users.list.title` (es) | Padrón | **Todas las cuentas** |
| `admin.users.list.title` (en) | Directory | **All accounts** |
| `admin.users.chart.title` (es) | Altas por mes | **Cuentas nuevas por mes** |
| `admin.users.chart.title` (en) | Signups per month | **New accounts per month** |

## F21 — Bug preexistente destapado por la hora del reloj

Al correr los tests a las **00:01**, falló `admin-sales`: `ageDays` daba 3 donde se esperaba 4.

**No lo introdujo este cambio.** `saleAgeDays` usaba `Math.floor` sobre la diferencia real, y
la seed fija las fechas con `daysAgo(4, 12)` —o sea **4 días atrás a las 12:00**—, que a las
00:01 son 3 días y 12 horas transcurridas → `floor` = 3. El test solo pasaba corriendo
después del mediodía.

**Arreglo:** `Math.round` en `saleAgeDays`, que hace que "hace 4 días" sea 4 sin importar la
hora. Es además el comportamiento correcto para el umbral de antigüedad, que no debería
depender del reloj. Se agregó un test de regresión que compara la antigüedad a las 09:00 y a
las 18:00, y el test existente dejó de afirmar un literal para comparar contra la fecha real
de la venta.

### Verificación

`biome check` ✅ (264 archivos), **291 tests** ✅ (49 archivos), `i18n:check` ✅ (588 claves),
build ✅.

---

## F22 — Navegación: "Cuenta" fuera y resaltado exclusivo

### Se quitó el ítem "Cuenta" de la navegación

Era un duplicado: la información de cuenta ya está a un clic desde el avatar del header
("Mi cuenta"). La navegación principal queda en **Medir · Catálogo · Historial**, iguales
para cualquier rol. Se retiraron también la clave `nav.account` y el import que quedó sin
uso.

### Resaltado exclusivo del ítem activo

**Qué reportó el usuario:** estando en Movimientos se encendían **dos** ítems —"Inventario"
y "Movimientos"—. Correcto: cada ítem se evaluaba por separado con `isNavItemActive`, y como
`/admin/inventory/movements` empieza con `/admin/inventory`, los dos matcheaban por prefijo.

**Arreglo:** `matchNavItem(pathname, items)` evalúa **todos los ítems juntos** y devuelve el
que tiene el prefijo más largo, o `null`. El shell calcula un único `activeTo` y cada
`NavLink` se marca con `to === activeTo`, así que es imposible que se encienda más de uno.
La lista se pasa completa a propósito: el empate por longitud se rompe por orden de
declaración, y para eso hacen falta todos los candidatos.

Sigue funcionando lo que ya andaba: una ruta hija **sin ítem propio** resalta a su padre
(`/admin/sales/7` → "Ventas").

**Test:** `src/test/nav-highlight.test.js` (6 casos), incluido el caso reportado
(`/admin/inventory/movements` gana "Movimientos" y no "Inventario"), rutas hijas sin ítem
propio, prefijos que se parecen (`/account/history` vs `/admin`) y el caso sin coincidencia.

### Verificación

`biome check` ✅ (265 archivos), **297 tests** ✅ (50 archivos), `i18n:check` ✅ (587 claves),
build ✅.

---

## F23 — El catálogo sin talle quedaba cargando para siempre

**Qué reportó el usuario:** `/catalog` no devolvía nada, con esqueletos en pantalla.

**Causa:** el trabajo de F13 había quedado **a medias**. Se había quitado el 422 del
controller y el estado bloqueante de la pantalla, pero el hook seguía con la guarda vieja:

```js
enabled: Boolean(sizeId)   // use-catalog.js
```

En TanStack Query una consulta deshabilitada queda en `isPending` **para siempre**, así que la
pantalla mostraba esqueletos y nunca resolvía. El comentario del hook ("sin `sizeId` no
consulta") también había quedado desactualizado.

**Arreglo:** se quitó la guarda y se corrigió el comentario, con una advertencia explícita de
no volver a ponerla. Se revisaron los otros `enabled` del proyecto (`use-profiles`,
`use-product`, `use-sale`, `use-generation`, `use-admin-sale`): todos guardan un identificador
que la ruta **exige**, así que son correctos.

**Segundo defecto, del mismo cambio a medias:** sin talle el controller devuelve
`variants: []`, y la tarjeta calculaba `totalAvailable = 0` y mostraba **"0 unidades
disponibles"**. Eso afirma que no hay stock cuando en realidad es **desconocido**. Ahora, sin
talle, la tarjeta no lista colores ni disponibilidad y muestra "Elegí un talle para ver
disponibilidad".

**Sobre el test que no lo detectó:** el test escrito en F13 afirmaba que hubiera *enlaces*
(`getAllByRole('link').length > 0`) y **pasaba** con el catálogo vacío, porque los enlaces de
la navegación alcanzaban. Ahora afirma que se rendericen las **tarjetas de producto**
(comparando contra los modelos reales que devuelve la API) y que aparezca el aviso de
disponibilidad. Esa aserción falla con el bug presente.

### Verificación

`biome check` ✅ (265 archivos), **298 tests** ✅ (50 archivos), `i18n:check` ✅ (588 claves),
build ✅.

---

## Anexo - Iconos PWA, favicon y colores del tema

Trabajo posterior al barrido inicial, mientras el usuario reemplazaba los íconos
placeholder por los definitivos.

### Los íconos están bien donde están

`public/` es la ubicación correcta: Vite lo sirve en la raíz web, así que
`/pwa-192x192.png` resuelve exactamente como lo declara el manifest. Moverlos rompería los
`src` absolutos y el `includeAssets`. **No se movió nada.**

### Colores del manifest, tomados del ícono real

Los valores anteriores seguían siendo de la paleta azul retirada. Se decodificó el ícono
para no adivinar: fondo `#1D1D1D`–`#2A2A2A`, marca `#D5D5D5`.

| | antes | ahora |
|---|---|---|
| `theme_color` | `#134379` (azul viejo) | `#1B1B1B` |
| `background_color` | `#E8F0FA` (azul viejo) | `#D5D5D5` |

Aplicado en `vite.config.js` **y** en el `<meta name="theme-color">` de `index.html` (deben
coincidir), y sincronizado en `scripts/generate-pwa-icons.ps1`, que todavía tenía el azul
y lo habría reintroducido al regenerar.

### Ícono maskable: era una copia byte a byte

`pwa-maskable-512x512.png` era idéntico a `pwa-512x512.png` (mismo SHA) y ambos eran 100 %
opacos y a sangre:

```
artwork size   512x512 = 100.0% x 100.0% del lienzo
margins        left 0.0%  right 0.0%  top 0.0%  bottom 0.0%
zona segura    FAIL — margen mínimo 0.0% (requiere >= 10%)
```

Android enmascara los maskable a círculo/squircle, así que habría recortado las esquinas de
la marca.

**Solución** (`build-icons.mjs`): se mide el recuadro real del arte por luminancia, se
calcula su radio desde el centro (259,5 px) y se escala el ícono completo para que entre en
el círculo seguro (40 % del ancho, 201,7 px) → 398x398 centrado en 512x512, con el fondo
medio del propio ícono (`#242424`) como relleno.

Se escala la imagen **completa** en lugar de extraer el recuadro del arte: las esquinas de
la imagen escalada son fondo puro y la máscara las recorta igual, así que no se pierde nada
y en cambio se preserva el degradado original. La primera versión extraía el recuadro y
dejaba una costura de **5,54 de luminancia**; así quedó en **0,75** (menos que la costura
natural del origen, 1,18).

Verificado: `0 de 43114` píxeles de arte caen fuera del círculo seguro.

### Favicon: seguía siendo el de Vite

`favicon.svg` era el logo genérico de Vite (un rayo `#863bff`), sin relación con la marca.
Se regeneró desde el ícono de la app: SVG autocontenido con fondo vectorial redondeado
(`#2a2a2a`) y la marca embebida como data URI — nítido a tamaño de pestaña, sin vectorizar
la forma a mano.

### Contraste de botones: la causa real era la cascada, no los valores

**Segundo reporte del usuario:** en tema oscuro los botones no tomaban el blanco, el tema
claro seguía con demasiado gris ("parece todo deshabilitado"), y el login volvía a ser la
página por defecto.

**Diagnóstico (con medición, no suposición):** se resolvió la cadena de variables en el CSS
construido y en el grafo de módulos de dev. En ambos, los valores correctos estaban
presentes y **ganaban** el orden de fuente:

```
--mantine-primary-color-filled  declared 3x, last wins -> var(--mantine-color-gray-9)  #212529
Mantine default @13828, mío @288852  -> OK, el mío va después
```

Pero el resolver de Mantine pasa por `removeDefaultVariables`, y **`MantineProvider`
inyecta su bloque en tiempo de ejecución**, después de que se importa la hoja del tema. Una
regla `:root` en un CSS propio queda entonces en una carrera que puede perder. Esa era la
causa: no los valores, sino **dónde** estaban declarados.

**Solución:** los tokens del primario se movieron al `cssVariablesResolver` de `theme.js`,
que es el mecanismo propio de Mantine para emitir variables por esquema. `theme.css` queda
solo con `color-scheme` (lo único que el resolver no puede expresar). Un solo origen de
verdad, sin pelea de cascada.

| token | claro | oscuro |
|---|---|---|
| relleno | `gray-9` `#212529` — casi negro | `dark-0` `#C1C2C5` — casi blanco |
| relleno hover | `gray-6` `#868E96` — se aclara | `dark-3` `#5C5F66` — se oscurece |
| contraste | blanco (lo aporta el CSS base) | `dark-9` — texto oscuro sobre relleno claro |

**Test de regresión:** `src/test/theme-tokens.test.jsx` (4 casos) monta `MantineProvider`
con `forceColorScheme` y afirma los tokens resueltos en `document.documentElement`. Esto es
lo que faltaba antes: los chequeos previos verificaban el *CSS construido*, que estaba bien,
y no los valores efectivos en el documento. El test habría detectado el problema.

> Nota: `--mantine-primary-color-contrast` en tema claro lo elimina
> `removeDefaultVariables` por coincidir con el default (`white`) y lo aporta el CSS base de
> Mantine, presente en `styles.layer.css`. Por eso el test de claro no lo afirma.


### Verificación

`biome check` ✅ (256 archivos), **263 tests** ✅ (44 archivos), build ✅ con los tokens
correctos en el CSS construido (`gray-9`/`gray-6` en claro, `dark-0`/`dark-3` en oscuro) y
`.vk-scrim` resolviendo a `var(--mantine-color-body)`.

> Pendiente de validación visual del usuario: si el salto de hover resulta demasiado
> brusco, ajustarlo a un paso (`gray-7` / `dark-2`) es un cambio de una línea en
> `theme/theme.css`.


> Pendiente del lado del usuario: instalar la PWA en un dispositivo real para ver el
> maskable ya recortado por Android. Acá se validó por geometría, no visualmente en el
> dispositivo.
