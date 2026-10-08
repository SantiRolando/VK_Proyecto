# Scan VKFit — Registro de iteraciones

> Detalle de lo implementado en cada tanda: decisiones, deuda asumida y arreglos colaterales.
> Este es el **único** archivo que crece con cada iteración, para que el plan
> (`scan-vkfit-fe-prototype-plan.md`) y el estado consolidado
> (`scan-vkfit-estado-y-pendientes.md`) queden estables y legibles.
> **Estado y próximos pasos:** `scan-vkfit-estado-y-pendientes.md` (§6 y §8).

## Índice

| Iteración | Hito | Historia | Foco |
|---|---|---|---|
| 3 | M1 | US1 | Talle como invitado |
| 4 | M1 | US2 | Cuenta y migración |
| 5 | M2 | US3 | Catálogo filtrado y sin stock |
| 6 | M2 | US4 | Coordinar la compra por Email o WhatsApp |
| 7 | M2 | US7 | (Admin) Gestionar ventas en curso |
| 8 | — | — | Tooling: alias de imports, Biome, deps de Mantine de §7.1 |
| 9 | M3 | US5 | Perfiles de medidas y direcciones |
| 10 | M3 | US6 | Feedback, puntos, cupones e historial |
| 11 | M4 | US8 | Dashboard de control |
| 12 | M4 | US9 | Inventario y catálogo admin |
| 13 | — | — | Deps de Mantine + DatePickerInput y gráfico en el dashboard |
| 14 | M5 | US10–US12 | Reportes, reglas/cupones y modo asistente |

> Las iteraciones 1 (capa de datos) y 2 (base UI) están resumidas en la tabla de la
> Fase 2 de `scan-vkfit-estado-y-pendientes.md` (§6).

---

## Iteración 3 — US1: Talle como invitado ✅

- Controller `size-generations` (POST/GET/GET:id) con motor **placeholder** (`mocks/domain/size-engine.js`, reemplazable por el motor real al final) + `sizes` + contacto público desde SETTING.
- Services (`size-service`) + hooks (`use-create-generation`, `use-generation`, `use-public-contact`).
- UI: `home-page` (3 caminos), `fit-page` (precarga `?line`/`linea` + `source` Direct/QR/Landing), `fit-form` (zod), `measure-help` (drawer con imágenes), `result-page` (talle, dominante, stock, adyacentes, CTA registro), `out-of-range` (contacto VK).
- CTA de la landing actualizado (`/fit?src=landing` y `/login`).

## Iteración 4 — US2: Cuenta y migración ✅

- Pantallas reales de auth: `login-page` (login unificado, redirección por rol, credenciales demo en modo mock), `register-page` (WhatsApp obligatorio + link a login), `otp-page` (request→verify, código mock 123456), `forgot-password-page`, `reset-password-page` — todas con `returnTo` sanitizado y errores traducidos por código.
- `auth-schema.js` (zod), `auth-shell.jsx` (contenedor común), `utils/zod-errors.js` (mapeo compartido).
- `AuthProvider.adoptSession` (para OTP) + menú de cuenta con logout en el `customer-layout` (T048).
- Migración de invitado: ya funcionaba en el controller (iteración 1); ahora el recorrido completo la dispara desde el registro/login con `guestSessionId` automático.

## Iteración 5 — US3: Catálogo filtrado y sin stock ✅

- Controllers `catalog` (listado filtrado por talle con `meta.hasStock`/`adjacentSizes` + detalle con disponibilidad por color) y `alerts` (suscripción idempotente por variante, lista agrupada por línea × talle, baja) + 11 tests.
- Dominio `alerts.js` (`notifyRestockAlerts`) para el aviso al reponer (se conecta en US9).
- Services `catalog-service`, `alerts-service` + 5 hooks con query keys.
- UI: `catalog-page` (estado "medí tu talle" sin `sizeId`), `product-card`, `product-detail` (colores agotados no seleccionables, otros talles), `no-stock-state` (mensaje + adyacentes rotulados), `restock-subscribe` (requiere cuenta, con `returnTo`), `alerts-page` (mis avisos, agrupados).
- Nota: la demanda no satisfecha no se registra aparte — se deriva de `SIZE_GENERATION.stockAvailableAtQuery=false` (§4.7).

## Iteración 6 — US4: Coordinar la compra por Email o WhatsApp ✅

- Dominio nuevo: `coordination-message.js` (asunto/cuerpo/URL `mailto:`/`wa.me` desde SETTING, plantillas es/en),
  `coupons.js` (vigencia, dueño, descuento con tope), `sales.js` (líneas resueltas contra el catálogo + validación de
  disponibilidad) y `money.js` (redondeo). 21 tests de dominio.
- Controllers: `sales` (`POST /sales` atómico con reserva derivada + `contact`, `GET /me/sales`, `GET /me/sales/:id`),
  `coupons` (`POST /coupons/validate`) y `addresses` (`GET/POST /me/addresses`, lo mínimo para el checkout). 23 tests.
- Services `sales-service` (incluye `validateCoupon`) y `addresses-service`, más 5 hooks en
  `features/checkout/hooks/`. Crear la venta invalida `['catalog']`, `['catalog-product']` y `['sales']` (T060).
- UI: `checkout-page` (`Stepper` entrega/canal/resumen; vertical en móvil), `delivery-step` (retiro o envío con
  agenda + alta rápida de dirección), `channel-step` (Email por defecto), `summary-step` (línea, cantidad, cupón y
  resumen en `Table`), `order-summary` reutilizado por la confirmación y `confirmation-page` (abre `contact.url`,
  con botón de respaldo y copiar mensaje).
- `STOCK_INSUFFICIENT` (T064): el conflicto se informa en el resumen sin perder la selección y se refresca la
  disponibilidad de la variante.
- i18n `checkout.*` (T065): 50 claves nuevas, paridad es/en en 317 claves.
- Selección encadenada por query (`fit` → `catalog` → `product` → `checkout`): `generationId`, `productId` y `sizeId`
  viajan para vincular la venta a la generación y resolver la variante en el checkout. `routes.product` acepta
  query y `routes.checkout` pasó a ser helper (como `routes.fit`/`routes.catalog`).
- Arreglos que destrabó el integrado (el primer uso real de esos archivos):
  - `product-detail` leía `color.variantId`, pero el DTO del catálogo expone `color.id`: el botón de compra
    navegaba con `variantId=undefined`. Corregido en el detalle de producto.
  - `channel-badge`, `sale-status-badge` y `stock-badge` (en `src/components/`) importaban `../../i18n/context.js`
    con la profundidad de los subdirectorios. Eran rutas inexistentes que no rompían el build porque todavía nadie
    los importaba.
  - `customer-layout` declaraba `labelKey` en `CustomerNavItem`, pero los datos de `NAV_ITEMS` traían `key`: la barra
    inferior móvil y la navegación de escritorio mostraban solo los íconos. Detectado por el test de componentes.
- Tests de componentes (cierra el pendiente de Testing Library de T003/T006, plan §4.9): se instalaron
  `@testing-library/{react,dom,user-event,jest-dom}` y `checkout-flow.test.jsx` recorre el flujo completo sobre el router
  y los providers reales (detalle de producto → checkout → confirmación) contra el transporte mock; verifica el cupón,
  el mensaje de coordinación, la apertura del canal y el descuento, y comprueba la reserva por contrato
  (`GET /me/sales` + disponibilidad del catálogo). `src/test/setup.js` suma los matchers de jest-dom, el cleanup y los
  polyfills de `matchMedia`/`ResizeObserver` que Mantine necesita en jsdom.
- Fuera de alcance por decisión: carrito multi-línea (hoy la selección es una línea) y la agenda completa de
  direcciones (editar / baja / predeterminada), que llega en US5.

## Iteración 7 — US7: (Admin) Gestionar ventas en curso ✅

- Controller `admin-sales` (T066): listado con filtros de estado, canal, rango de fechas y paginación (`meta.total`),
  detalle y `PATCH /admin/sales/:id/status`. Confirmar crea la `Transaction(Outbound, SaleConfirmed)` con sus líneas y
  descuenta el físico; cancelar libera la reserva (derivada) y devuelve el uso del cupón. 13 tests.
- El serializador expone `allowedTransitions` —la máquina de estados vive en el mock—, `ageDays` e `isStale`: el FE
  solo dibuja las acciones que recibe y no conoce las reglas.
- **Q-11 resuelto sin TTL**: `SETTING.stale_sale_days` (3 por defecto) marca las ventas abiertas que llevan demasiado
  tiempo sin respuesta; el admin decide si las mueve o las cancela (el dashboard de US8 podrá alertar).
- Service `admin-sales-service` + 3 hooks (T067); mover una venta invalida `['admin','sales']`, `['catalog']`,
  `['catalog-product']` y `['admin','inventory']`.
- UI: `sales-page` (T068) con `Tabs` por estado, filtro de canal por `SegmentedControl`, `responsive-list` y la
  antigüedad resaltada; `sale-detail-page` (T069) con cliente, teléfono, logística, canal, fechas, resumen y acciones
  con `Modal` de confirmación.
- i18n `admin.sales.*` (T070): 35 claves nuevas (351 con paridad); `admin.saleDetail.title` se dio de baja junto con
  su stub.
- `order-summary` y el formateo de direcciones (`utils/address.js`) quedaron compartidos entre checkout, confirmación
  y panel.
- Test de componentes `admin-sales.test.jsx`: listado con filtros, confirmación por modal, cancelación y cierre del
  modal sin cambios.
- **Checkpoint M2**: recorrido completo cliente (US1→US4) + administrador (US7) demostrable.

## Iteración 8 — Tooling: alias, Biome y deps de Mantine ✅

- **Alias de imports** (`vite.aliases.js`, compartido por Vite y Vitest, + `jsconfig.json` para el editor): 128 archivos
  reescritos con un codemod de un solo uso. Set: `@app`, `@api`, `@assets`, `@components`, `@config`, `@constants`,
  `@features`, `@hooks` (reservado), `@i18n`, `@mocks`, `@pages`, `@test`, `@theme`, `@utils`.
- **Biome** reemplaza a ESLint (y a Prettier, que no estaba instalado): `biome.json` con lint + formato + la regla
  `noRestrictedImports`, que ahora también cubre los alias (`**/mocks/**` y `@mocks/**`) y se validó con un caso temporal.
  Scripts: `npm run lint` = `biome check .`, `npm run format` = `biome format --write .`. Se formatearon 60 archivos y se
  ordenaron los imports de 102 (assist `organizeImports`).
- **Deps de Mantine de §7.1 declaradas** en `package.json` (`@mantine/{form,notifications,modals,dates}`, `dayjs`,
  `recharts`, `mantine-form-zod-resolver`): la instalación queda a cargo del usuario, así que el lock queda
  desactualizado hasta que corra `npm install`.
- Limpieza que destrabó el ruleset de Biome: `RequireRole` pasa a `requiredRole` (la prop `role` chocaba con el atributo
  ARIA), `responsive-list` pierde el `onCardClick` que nadie usaba (y su wrapper con `stopPropagation`), y los dos
  `key={index}` de los skeletons quedan con un `biome-ignore` justificado.
- Único cambio de producto: la clave i18n pendiente `fit.result.title` (la pantalla de resultado mostraba la clave
  cruda) → 352 claves con paridad.
- Verificación: `biome check` ✅ (exit 0), 141 tests ✅, `i18n:check` ✅, build mock ✅ y http ✅ con SC-005 (el bundle
  http sigue sin `src/mocks/` pese a los alias del import dinámico).

## Iteración 9 — US5: Perfiles de medidas y direcciones ✅

- Controller `profiles` (T071): CRUD completo + `PUT /me/profiles/:id/default` + baja **lógica** (`active`, mismo
  criterio que ADDRESS para no romper el historial). Un solo predeterminado por usuario: al dar de baja el que lo era,
  el más antiguo que queda se promueve. 11 tests.
- `addresses` pasa a CRUD completo (T075): el checkout solo necesitaba listar + alta (T059); ahora suma edición, baja
  lógica y predeterminada, con el mismo `ensureDefault`. 10 tests.
- Dominio compartido `mocks/domain/measures.js` (`readMeasures`, `MEASURE_FIELDS`, `hasMeasures`): lo usan tanto
  `size-generations` como `profiles`. `POST /size-generations` ahora valida que el `profileId` sea del propio cliente
  (404 si no) y rechaza atribuir una generación a un perfil ajeno o inexistente.
- Services `profiles-service`, `addresses-service` (CRUD completo) y hooks: `use-profiles` (`useProfiles`,
  `useResolvedProfile`, mutaciones) y `use-addresses` (T072). Cambiar de perfil invalida `['profiles']` y
  `['size-generations']`, porque el historial se separa por perfil.
- UI (T073/T074/T075): `profile-selector` global en el header del cliente; `profile-form` compartido;
  `profiles-page` (alta/edición/predeterminado/baja); `addresses-page` (misma agenda para direcciones);
  `save-profile-modal` + tarjeta “Guardar como perfil” en el resultado de medición; `fit-page` precarga el perfil
  activo (y remonta el formulario al cambiarlo).
- Refactors que exigió el compartir: `utils/address.js` (líneas + schema zod) y `utils/measures.js` (`MEASURE_FIELDS`,
  `measuresShape`, `measuresFormValues`); se suma `components/address-form.jsx` compartido y el checkout deja de tener
  su propio formulario/hooks de dirección.
- i18n (T076): `account.profiles.*`, `account.addresses.*`, `address.*` y `common.{delete,cm}` en es/en; se dio de baja
  `checkout.address.*`. Paridad en **377 claves**.
- Test de componentes `profiles-addresses.test.jsx` (4 tests) sobre el router y los providers reales: crea dos perfiles
  y administra la agenda (edición, predeterminado y baja), alterna el perfil desde el selector global verificando que
  la medición se precarga, comprueba en el contrato que el historial se separa por perfil, y recorre el ciclo completo
  de direcciones.
- Bug real destrabado por el test: `address-form` (compartido con el checkout) leía `event.currentTarget.value`
  **dentro del updater de estado**, que React puede ejecutar más tarde, cuando `currentTarget` ya es `null` (crashea al
  tipear rápido). Se lee el valor en el momento del evento. El mismo patrón se corrigió también en `login-page`,
  `register-page` y `reset-password-page` (mismo bug latente, no cubierto por tests).
- Fuera de alcance por decisión: la pantalla de historial por perfil llega en US6; acá la separación se verifica en el
  contrato (`GET /size-generations?profileId=`).
- Verificación: `biome check` ✅, 161 tests ✅, `i18n:check` ✅ (377 claves), build mock ✅ y http ✅ con SC-005.

## Iteración 10 — US6: Feedback, puntos, cupones e historial ✅

- Dominio `points.js` (T077): sorteo de puntos con `success_probability`, tope diario contando **premios del día**
  (no calificaciones), y canje de plantillas con código único. El azar se inyecta (`random`) para testear sin
  depender de `Math.random`; los controllers usan el default. 8 tests.
- Controllers (T078): `feedback` (`PATCH /size-generations/:id/feedback`, una vez por generación con `ALREADY_RATED`),
  `points` (`GET /me/points`), `rewards` (`GET /rewards`, `POST /rewards/:couponId/redeem`, `GET /me/coupons`). 14 tests.
  - El invitado puede calificar pero no suma puntos (Q-15): `POINTS_MOVEMENT` exige usuario; el usuario con saldo
    insuficiente recibe `POINTS_INSUFFICIENT` (caso borde §2.5).
  - El serializador de generaciones suma `profileId`, `comment`, `ratedAt` y `source` (los consumen historial y detalle).
- Services/hooks (T079): `rewards-service` + `use-rewards.js` (puntos, plantillas, cupones y canje); el feedback se suma a
  `size-service` (`submitFeedback`) con su hook en `features/feedback/`. Calificar invalida historial, puntos y cupones.
  El cupón canjeado queda aplicable en el checkout por el camino existente (validación con dueño).
- UI (T080–T082): `feedback-drawer` (Chico/Correcto/Grande + comentario, con el resultado del premio y `points-toast`),
  tarjeta de feedback en el resultado de medición (invitado y cliente), `history-page` (filtro por perfil que sigue al
  perfil activo, pendientes de calificar), `orders-page` (mis compras) y `rewards-page` (saldo, canje, mis cupones y
  movimientos). Las tres pantallas reemplazan sus stubs en el router.
- i18n (T083): `feedback.*`, `account.{history,orders,rewards}.*` y `checkout.coupon.mine` en es/en; paridad en
  **415 claves**.
- Checkout: los cupones propios (canjeados) se ofrecen como atajo en un clic junto al campo de cupón (T082).
- Seed: Ana queda con **120 puntos** (40 de feedback + un `Adjustment` de 80) para que el canje sea demostrable;
  el saldo sigue cuadrando con los movimientos.
- Test de componentes `rewards-history.test.jsx` (3 tests): historial por perfil + calificar una pendiente, canje de
  puntos con saldo insuficiente reflejado en la UI, y listado de compras. El test del checkout suma que el cupón propio
  aparece como atajo en el resumen.
- Ajuste destrabado por el test: el `Textarea` de Mantine con `autosize` rompe en jsdom (`Autosize` asume un
  `defaultView` con `addEventListener`); se usó `minRows` fijo.
- Verificación: `biome check` ✅, 186 tests ✅, `i18n:check` ✅ (415 claves), build mock ✅ y http ✅ con SC-005.
- **Checkpoint M3**: recorrido cliente completo (US1→US6) + administrador (US7) demostrable.

## Iteración 11 — US8: Dashboard de control ✅

- Dominio `date-range.js` (nuevo): normaliza `from`/`to` (ISO o `YYYY-MM-DD`, con día completo en el límite superior)
  e implementa `inRange`. `admin-sales` deja de tener su copia y suma el filtro `open=true` (ventas que retienen
  reserva) para el bloque de ventas en vuelo. 6 tests.
- Controller `admin-analytics` (T084): `GET /admin/analytics/{conversion,precision,critical-stock}`. 4 tests.
  - Conversión = generaciones vs. compras coordinadas del rango (+ `ratio`).
  - Precisión = % de feedback "Correcto" separando **compró** (tiene venta no cancelada) de **solo consultó**.
  - Stock crítico reusa `listCriticalVariants` (dominio) y ordena por faltante; el serializer expone
    `quantity/reserved/available/minStock/deficit` (base para inventario, US9).
- Service `admin-analytics-service` + hooks `use-conversion`/`use-precision`/`use-critical-stock` con el rango en la
  query key (T085). Las ventas en vuelo reusan `useAdminSales({ open: true })`.
- UI (T086): `dashboard-page` con los cuatro bloques: conversión (`RingProgress` + conteos), precisión (dos `Progress`),
  stock crítico (lista con faltante) y ventas en vuelo (cliente, teléfono, canal, entrega y acceso al detalle).
  Reemplaza el stub de `/admin`.
- i18n (T087): `admin.dashboard.*` (18 claves nuevas) en es/en; paridad en **433 claves**.
- Test de componentes `dashboard.test.jsx` (2 tests): los cuatro bloques con datos de la seed (precisión 2/2, stock
  crítico presente, ventas en vuelo #1/#2/#5 con teléfono y sin las cerradas) y el filtro de fechas (verifica que el
  rango pedido cambie a 7 días y a "todo").
- **Desvío consciente**: el rango se elige con presets (`SegmentedControl`) y los KPIs usan solo componentes de core
  (`RingProgress`/`Progress`): menos bundle y testeable en jsdom. `@mantine/dates`/`@mantine/charts`/`dayjs` se
  instalaron después (iteración 13); `DatePickerInput` es un popover que jsdom no maneja bien, así que pasarlo y sumar
  un gráfico lazy queda como mejora de UI (el contrato `from`/`to` no cambia).
- Ajuste de tooling: los tests de componentes son lentos (jsdom + router/providers reales + formularios de Mantine) y el
  default de Vitest (5 s) se quedaba corto en paralelo (`Test timed out`); `testTimeout`/`hookTimeout` pasan a 20 s.
- Verificación: `biome check` ✅, 198 tests ✅, `i18n:check` ✅ (433 claves), build mock ✅ y http ✅ con SC-005.

## Iteración 12 — US9: Inventario y catálogo del panel ✅

- Dominio `inventory.js` (T088): `MANUAL_REASONS` (sin `SaleConfirmed`, que es automático), dirección por motivo,
  validación de líneas y `applyStockTransaction`, que ajusta el físico y notifica el aviso de reposición cuando una
  variante pasa de disponible 0 a > 0 (§5.3). 7 tests.
- Controllers (T088):
  - `admin-variants` (`GET/POST/PATCH`): inventario con físico/reservado/disponible/mínimo/crítico y filtros por línea y
    bajo mínimo; el **físico no se edita por PATCH** (cambia solo con movimientos, para no romper la auditoría).
  - `admin-products` (`GET/POST/PATCH/DELETE`): CRUD con baja lógica; el catálogo del cliente filtra `product.active`.
  - `admin-stock-transactions` (`POST`, `GET`, `GET /reasons`): ajuste con motivo obligatorio + auditoría filtrable; el
    catálogo del cliente refleja el cambio al instante (verificado en el test).
  - `admin-analytics` reusa el serializador de inventario (se eliminó su copia). 14 tests.
- Services/hooks (T089): `admin-inventory-service`, `admin-catalog-service` y los hooks de inventario, movimientos y
  productos. Un ajuste invalida inventario, movimientos, analítica y catálogo.
- UI (T090–T092): `inventory-page` (filtros, alerta crítica, modal de ajuste con motivo y dirección), `movements-page`
  (auditoría con motivo, dirección, líneas y autor) y `products-page` (alta/edición/baja lógica de productos, reactivar,
  y modal de variantes con alta/edición). Los tres stubs del router quedaron reemplazados.
- i18n (T093): `admin.inventory.*`, `admin.movements.*` y `admin.products.*`; paridad en **487 claves**.
- Test de componentes `inventory.test.jsx` (3 tests): ajuste con motivo (la variante sale de crítico), auditoría del
  movimiento y reflejo en el catálogo; listado de movimientos; alta y baja lógica de un producto.
- Aprendizajes de test (jsdom): los `Select`/`Menu` de Mantine no abren de forma fiable (Popover + transición). Los
  controles de estos formularios pasaron a `Radio.Group` (mejor en móvil para 2–5 opciones) y el helper del selector de
  perfil de US5 busca el dropdown en el DOM crudo. Los `Select` que quedan (filtros y color/talle de variantes) están
  cubiertos por los tests de contrato.
- Simplificación consciente (Q-14): el “cambio por talle” se registra como movimientos separados (entrada + salida) en
  lugar de dos transacciones enlazadas en un solo POST; el contrato `{reason, direction, lines}` queda igual.
- Verificación: `biome check` ✅, 222 tests ✅, `i18n:check` ✅ (487 claves), build mock ✅ y http ✅ con SC-005.
- **Checkpoint M4**: recorrido cliente (US1→US6) + panel (US7–US9) demostrable.

## Iteración 13 — Deps de Mantine + DatePickerInput y gráfico en el dashboard ✅

- Se corrió `npm install` (quedaba pendiente desde la iteración 8): entraron `@mantine/dates`, `@mantine/form`,
  `@mantine/modals`, `@mantine/notifications`, `dayjs` y `mantine-form-zod-resolver` (más `@mantine/store` transitivo).
- **Ajuste de versiones**: el lockfile fijaba `@mantine/core@9.6.0` mientras los paquetes nuevos resolvían a `9.6.3`, lo
  que daba `ERESOLVE` (los paquetes de Mantine exigen la misma versión entre sí). Se alinearon los siete `@mantine/*` a
  `^9.6.3` y se regeneró el lock; quedan core/hooks/charts/dates/form/modals/notifications en **9.6.3**.
- **Dashboard**: el rango de fechas pasa a `DatePickerInput type="range"` de `@mantine/dates` (defaults de la librería +
  `locale` del idioma activo, con `dayjs/locale/es` registrado) y la conversión suma un `BarChart` de `@mantine/charts`
  cargado con `import()` en su propio chunk (`React.lazy`) — así recharts (~395 kB) no entra al bundle de arranque. Se
  agregó `@mantine/dates/styles.layer.css` al `index.css`.
- El test del dashboard deja de clickear presets: verifica los cuatro bloques y que los KPIs se pidan con el rango por
  defecto (últimos 30 días). El efecto del rango sobre los datos sigue cubierto por los tests de contrato (`date-range`,
  `admin-analytics`), porque el popover de `DatePickerInput` y el `ResponsiveContainer` de recharts no se manejan bien en
  jsdom (recharts avisa `width(0)/height(0)`, inofensivo).
- Verificación: `biome check` ✅, 222 tests ✅, `i18n:check` ✅ (484 claves), build mock ✅ y http ✅ con SC-005 (el http
  sigue sin `src/mocks/`; el gráfico queda en un chunk aparte).

## Iteración 14 — M5: US10, US11 y US12 ✅

### US10 — Demanda no satisfecha y comentarios

- Controllers en `admin-analytics` (T094): `GET /admin/analytics/missing-sizes` agrega las generaciones con
  `stockAvailableAtQuery === false` por línea × talle (Q-12) y devuelve la grilla completa en `meta` para dibujar los
  ceros; `GET /admin/analytics/comments` filtra por calificación, línea y rango.
- `missing-sizes-page` (mapa de calor con `Table` coloreada por intensidad, una fila por línea) y `comments-page`
  (filtros + tarjetas con calificación y comentario) (T095).
- Exportación (T096): `utils/download.js` (CSV propio, con BOM y escapado) y `utils/excel.js` (SpreadsheetML 2003 que
  Excel abre sin dependencias), orquestados por `hooks/use-export.js`; el Excel se carga con `import()` y queda en su
  propio chunk (0,8 kB). Botones en ambos reportes.

### US11 — Reglas del juego y cupones

- `admin-settings` (T097): `GET/PATCH /admin/settings` con DTO en camelCase (probabilidad, puntos por feedback, tope
  diario, contacto de coordinación, `stale_sale_days`) y validación de rangos; editar la probabilidad a 100 hace que todo
  feedback otorgue puntos (verificado de punta a punta).
- `admin-coupons` (T097): `GET/POST/PATCH /admin/coupons` con validación de código único y tipos de descuento. Editar el
  `pointsCost` de una plantilla se refleja al instante en `GET /rewards` del cliente (test independiente de US11).
- `settings-page` (formulario por bloques con confirmación de guardado) y `coupons-page` (tabla con alta/edición en
  modal) (T098).

### US12 — Modo asistente

- `POST /size-generations` acepta `onBehalf` + `customerId` (T099): solo el personal puede generarlas, la generación
  queda con `adminId` (y `customerId` si se vincula), valida que el `profileId` sea del cliente vinculado y el detalle
  es accesible para el admin que la creó. El serializador expone `onBehalf`.
- `assistant-page` (T100) reusa `fit-form` con el switch “Para terceros”, vínculo opcional a un cliente
  (`GET /admin/customers`, endpoint nuevo) y acepta `?line=` como `/fit`.
- En el resultado, una generación `onBehalf` no ofrece guardar perfil ni calificar (es de un tercero). El test verifica
  que cuenta en las métricas globales y **no** en el historial personal del admin.
- i18n (T101): `admin.{analytics,missingSizes,comments,settings,coupons,assistant}.*`; paridad en **547 claves**.
- Tests nuevos: 17 de controllers (analytics 3, settings 5, coupons 6, size-generations 3), 6 de exportación
  (`buildCsv`/`buildExcelXml` + descarga) y 6 de componentes (`analytics`, `settings`, `coupons`, `assistant`).
- Verificación: `biome check` ✅, 251 tests ✅, `i18n:check` ✅ (547 claves), build mock ✅ y http ✅ con SC-005.
- **Checkpoint M5**: recorrido completo cliente (US1→US6) + panel (US7→US12) demostrable. Queda F13 (pulido).

## Iteración 15 — F13: pulido y validación (T102–T110) ✅

Cierre del prototipo: responsive, accesibilidad, rendimiento, estados de error, README y verificación final.

### Responsive y accesibilidad (T102/T103)

- **Auditorías**: barrido estático de las ~85 pantallas/componentes a 360/768/1280 px y de accesibilidad; los hallazgos se corrigieron en el lugar.
- **Desbordes en 360 px**: las cards que enfrentaban un bloque de texto con 2–3 botones en
  `Group wrap="nowrap"` pasan a `wrap="wrap"` (direcciones, perfiles, catálogo admin); el header del cliente
  reduce densidad (gap menor, nombre de usuario y perfil truncados con `max-w`/`truncate`, selector de perfil oculto
  por debajo de `sm`). El `ResponsiveList` (table↔cards) conmuta en `md` (62em) y las tablas del panel bajan su
  `minWidth` a 900 px: se evita el scroll interno a 1280 px.
- **Tablas y cabeceras**: el resumen del pedido (`OrderSummary`) queda en `Table.ScrollContainer`; los tabs de ventas
  pasan a `Scroller` dentro de `Tabs.List` (patrón de Mantine para listas que no caben) y los links del header de la
  landing ganan área táctil (`p-2 -m-2`).
- **Objetivos táctiles**: los botones que se tocan en móvil suben de `xs`/`compact-sm` a `sm`/`compact-md`
  (login/logout, reinicio de error, acciones del checkout, feedback de historial, alertas, canje de cupones).
- **Accesibilidad**: los selectores de talle sin stock y del detalle de producto dejan de ser `Badge` con `onClick`
  (mouse-only) y pasan a botones; `LanguageSwitch` pasa a `SegmentedControl` con `aria-label` traducido (antes el
  idioma activo era texto blanco sobre header blanco y el estado solo se leía por color); `<html lang>` y
  `document.documentElement.lang` acompañan al idioma activo; los 15 `Modal`/`Drawer` ganan
  `closeButtonProps` con `aria-label` traducido; esqueletos y loader exponen `role="status"` + `aria-busy`;
  el toast de puntos es un live region; la calificación del feedback tiene nombre accesible y su error `role="alert"`;
  saltos de encabezado corregidos en la landing (`order={3}`) y valores largos (emails) con `wordBreak`.
- **Contraste**: `theme.js` + `cssVariablesResolver` oscurecen `--mantine-color-dimmed` (gray-7) y
  `--mantine-color-placeholder` (gray-6) en esquema claro; el resolver se mergea sobre el default de Mantine
  (`getMergedVariables`), así que no se pierde ningún token.
- **Decisión de producto**: se mantiene la apertura automática del canal en la confirmación (cubierta por test) y solo
  se marca el aviso de copiado como live region.

### Rendimiento (T104)

- El hero pasa de `indoor-swimming-pool.png` (2.552 MB) a `.jpg` 1600×900 q82 (**294 kB**) re-codificado con
  `System.Drawing`; revisado a ojo, sigue nítido.
- Bundle del build mock: `index` 520 kB (159 kB gzip), `esm` (recharts) 405 kB **en su propio chunk** cargado por
  `import()` solo en el dashboard, páginas admin en chunks por ruta (dashboard 75 kB, ventas 11,5 kB, productos 10,8 kB),
  `mock-transport` 63 kB **lazy**, `excel` 0,8 kB lazy, CSS 289 kB. Imágenes de medidas 65–301 kB.
- Sin `Lighthouse` en la caja de trabajo (sin navegador): queda como parte de la revisión manual del usuario.

### Estados de error (T107)

- `POST /dev/router { latencyMs?, failRate? }` reconfigura el router en caliente y `/dev/*` está exento de la
  simulación de fallos, así que la propia app (o un test) siempre puede apagarla.
- `src/test/error-states.test.jsx` (4 tests) enciende `failRate=1`, verifica el estado de error y reintenta hasta
  recuperar en cuatro pantallas con datos: detalle de producto (invitado), historial del cliente, catálogo (invitado) y
  direcciones del cliente.

### Verificación de cierre (T105/T106/T108/T109/T110)

- **SC-005**: en el build `VITE_API_MODE=http` no aparecen los marcadores `mock-transport` ni `guest-demo-1`
  (el mock queda fuera del bundle). Nota menor: las credenciales demo siguen como *strings* muertos en el chunk de
  `login-page` (la rama está detrás de `env.isMock`); no ejecutan nada, se deja documentado.
- **i18n**: barrido de literales en JSX → 0 coincidencias; `i18n:check` ✅ con **548 claves** (nueva `nav.language`).
- **README** (`app/frontend/README.md`): arquitectura de la capa de datos, cómo escribir un controller/service/hook,
  cómo pasar a la API real y variables de entorno.
- **T108** (recorrido §7.3 en navegador) y **T110** (smoke Playwright opcional) quedan del lado del usuario: el
  recorrido manual de las 12 historias es la revisión previa a la demo.
- Verificación: `biome check` ✅, **256 tests** ✅ (41 archivos, corridos 3 veces seguidas), `i18n:check` ✅ (548 claves),
  build mock ✅ y http ✅ con SC-005.

## Iteración 16 — Fase 14: PWA instalable y offline ✅

Pedido explícito del usuario; en el spec original la PWA estaba **fuera de alcance** (principio V). Se implementa y se
actualizan constitución/plan.

### Decisión de tooling

- **`vite-plugin-pwa@1.3.0`** (dev dependency; arrastra `workbox-build`/`workbox-window`). Se eligió sobre un service
  worker a mano porque el precache necesita la lista de assets **hasheados** del build: hacerlo sin el plugin obliga a
  estrategias de runtime y pierde el “todo el shell offline”. Alternativas descartadas: MSW (SW de otra cosa, no precache),
  `@vite-pwa/assets-generator` (los íconos son placeholders, no vale una dependencia más).
- **`registerType: 'autoUpdate'` + `injectRegister: 'auto'`**: el plugin inyecta `registerSW.js` en el `index.html`, así
  que **no** se importa `virtual:pwa-register` y jsdom/Vitest quedan intactos (0 cambios en tests).

### Manifest y documento (T111)

- Manifest en la config de Vite: `name`/`short_name`, `description`, `lang: es`, `display: standalone`, `orientation`,
  `start_url`/`scope`/`id` = `/`, `theme_color` `#134379` (vikinga-7) y `background_color` `#E8F0FA`.
- Íconos **placeholder** (Q-16: la marca real está pendiente) generados con `scripts/generate-pwa-icons.ps1`
  (System.Drawing, solo Windows): `pwa-192x192`, `pwa-512x512`, `pwa-maskable-512x512` (arte dentro de la zona segura)
  y `apple-touch-icon` 180. El script queda en el repo para regenerarlos cuando llegue el logo.
- `index.html`: `description`, `theme-color`, `apple-touch-icon` y `apple-mobile-web-app-*`. **No** se activó
  `viewport-fit=cover`: sin poder probar en dispositivo, extiende el contenido bajo el status bar y el header queda tapado;
  queda documentado con el plan de safe-area insets al probar.

### Service worker y política de caché (T112)

- **Precache de todo el build** (128 entradas, ~3,3 MB: shell + chunks de todas las rutas + imágenes de medidas + fuentes).
  Como cada ruta es un chunk propio ya precacheado, la app completa queda navegable sin conexión, no solo lo visitado.
- **Navegación SPA offline**: `NavigationRoute` a `index.html` con `denylist` de `/^\/api\//` (una ruta de API nunca se
  resuelve con el shell).
- **API**: `NetworkFirst` para `GET /api/` (caché `vkfit-api-get`, timeout 3 s, expiración 24 h, 50 entradas, solo 200).
  Las escrituras no se cachean. En modo `mock` no hay red en juego: el offline es total.
- Sin push y sin prompt de actualización (`skipWaiting` + `clientsClaim`); para avisar de una versión nueva con texto
  traducido alcanza con `registerType: 'prompt'` + `virtual:pwa-register/react`.

### Verificación (T113)

- `npm run build` ✅ genera `manifest.webmanifest`, `sw.js`, `workbox-*.js` y `registerSW.js`; `dist/index.html` sale con
  `<link rel="manifest">`, `theme-color`, los meta de Apple y el script de registro.
- **SC-005 intacto**: el build `http` no contiene `mock-transport`, `guest-demo-1` ni `vkfit.mockdb` (0 coincidencias), y
  su `sw.js` no menciona el mock (el precache del build http es de 133 entradas, ~3,24 MB).
- `biome check` ✅ (incluye `vite.config.js`), **259 tests** ✅ (42 archivos: los 3 nuevos de `src/test/pwa.test.js`
  verifican que los íconos del manifest existan, que el documento declare los metas de instalación y que el SW siga en
  `autoUpdate` con precache) y `i18n:check` ✅ (548 claves: no hubo claves nuevas porque la PWA no agrega UI propia).
- **No verificable acá**: instalación real en un navegador/dispositivo. Queda `npm run build && npm run preview -- --host`
  y, en DevTools → Application, comprobar manifest, SW activo, Cache Storage y el modo offline.
- Docs actualizadas: `CLAUDE.md` (regla PWA reescrita), `app/frontend/README.md` (sección “PWA (instalable y offline)”),
  plan (principio V, alcance, §4.1/§4.2, §7.1, Fase 14) y `scan-vkfit-estado-y-pendientes.md`.
