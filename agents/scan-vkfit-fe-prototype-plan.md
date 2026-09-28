# Scan VKFit — Plan de implementación end-to-end del prototipo FE

> **Estado:** borrador para revisión · **Fecha:** 23-sep-2026
> **Stack:** React + Vite + Mantine · **Datos:** mock detrás de una capa API intercambiable por REST
> **Fuentes:** `vkscanfit.pdf` (ERD), `User_Journey.pdf` (documentación técnica), `Scan_VKFit__Recorrido_de_la_experiencia.pdf` (alcance funcional) y `CLAUDE.md` (reglas de FE)
> **Seguimiento:** el estado de cada tarea se marca en §8 (`[x]` hecha · `[~]` parcial o con desvío · `[ ]` pendiente · `➖` descartada); el estado consolidado está en `agents/scan-vkfit-estado-y-pendientes.md` y el detalle por iteración —decisiones, deuda y arreglos colaterales— en `agents/iteraciones.md`.

---

## 0. Cómo leer este documento (mapeo a spec-kit)

Spec-kit organiza el trabajo en una **constitución** del proyecto (`.specify/memory/constitution.md`) y, por cada feature, una carpeta `specs/<feature>/` con `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` y `tasks.md`. Este documento contiene esos artefactos en un solo archivo, en el mismo orden en que el flujo los produce, para que se puedan partir directamente.

| Sección de este documento | Artefacto spec-kit | Destino sugerido |
|---|---|---|
| §1 Constitución | `constitution.md` | `.specify/memory/constitution.md` |
| §2 Especificación | `spec.md` (qué y por qué, sin stack) | `specs/001-scan-vkfit-fe-prototype/spec.md` |
| §3 Investigación y decisiones | `research.md` | `.../research.md` |
| §4 Plan técnico | `plan.md` (contexto técnico, *Constitution Check*, estructura) | `.../plan.md` |
| §5 Modelo de datos | `data-model.md` | `.../data-model.md` |
| §6 Contratos | `contracts/` | `.../contracts/*.md` |
| §7 Quickstart | `quickstart.md` | `.../quickstart.md` |
| §8 Tareas | `tasks.md` (IDs `T###`, marcador `[P]`, etiqueta `[USn]`, rutas exactas) | `.../tasks.md` |
| §9 Preguntas abiertas | salida de `/speckit.clarify` | resolver antes de `/speckit.plan` |

**Secuencia recomendada de comandos** (Claude Code):

1. `specify init` en el repo → `/speckit.constitution` pegando §1.
2. `/speckit.specify` con §2 → `/speckit.clarify` atacando §9 (las preguntas de mayor impacto primero: Q-01, Q-03, Q-04, Q-06).
3. `/speckit.plan` con §3–§6 como restricciones técnicas.
4. `/speckit.tasks` (usar §8 como referencia de granularidad) → `/speckit.analyze` → `/speckit.implement`.

> Nota práctica: el comando `implement` de spec-kit puede no cargar la constitución por defecto. Como las reglas de `CLAUDE.md` son no negociables, conviene mantenerlas también en `CLAUDE.md` (que ya existe) y no depender solo de la constitución.

---

## 1. Constitución del proyecto (`constitution.md`)

**Proyecto:** Scan VKFit FE (prototipo) · **Versión:** 1.0.0

### Principios

**I. Mantine primero y documentación local obligatoria.**
La UI se construye con componentes, hooks y sistema de estilos de Mantine. Antes de escribir o modificar código que use Mantine se consulta `agents/llms-full.txt` (props, Styles API, ejemplos). No se agregan otras librerías de UI.

**II. Convenciones de nombres.**
Archivos de componentes React en `kebab-case` (`landing-page.jsx`); componentes en `PascalCase` (`LandingPage`). Aplica a todos los archivos del proyecto salvo los que una herramienta exija con otro nombre (`vite.config.js`, etc.). Se verifica con lint.

**III. i18n total, sin literales.**
Ningún string visible para el usuario aparece como literal en el código. Todo texto usa `useI18n()` con claves. Cada clave se agrega **al mismo tiempo** a `src/i18n/locales/es.js` y `src/i18n/locales/en.js`. Esto incluye: etiquetas de enums, mensajes de error de API, placeholders, `aria-label`, títulos de página, notificaciones y textos de estados vacíos.

**IV. Rutas en inglés y centralizadas.**
Las rutas se definen en inglés sin importar el idioma del cliente (`/generator`, no `/generador`). Viven en un único módulo (`src/app/routes.js`); ningún componente escribe paths a mano.

**V. Diseñado para PWA, sin implementar PWA todavía.**
Mobile-first, rendimiento y carga rápida como requisito de diseño (code-splitting por ruta, dependencias livianas, estados de carga con skeletons, datos con caché declarativa). **No** se agrega service worker, manifest, ni plugin PWA en esta iteración. Se evita cualquier decisión que bloquee un soporte offline futuro.

**VI. FE agnóstico de su fuente de datos.**
Los componentes jamás importan de `src/mocks/`. Todo dato pasa por `services → apiClient → transport`. El transporte *mock* y sus *controllers* imitan un servidor REST y son descartables: pasar a la API real debe requerir cambiar una variable de entorno y, a lo sumo, ajustar mapeos localizados.

**VII. Sin lógica de negocio del backend en el FE.**
Algoritmo de talle, cálculo de puntos, reserva/descuento de stock, validación de cupones y transiciones de estado viven **solo** en los controllers mock (`src/mocks/`). El FE muestra resultados y valida formato, no decide reglas de negocio.

**VIII. Simplicidad.**
Sin abstracciones especulativas, sin estado global fuera de los contextos definidos, sin dependencias que no estén justificadas en `research.md`.

**IX. Lógica de dominio verificable.**
El motor de talles, la reserva de stock, los puntos, el router mock y la paridad de i18n tienen tests automatizados. La UI se verifica con el recorrido manual de `quickstart.md`.

### Restricciones y gates de calidad

- Lint **y formato** verdes con Biome (`npm run lint` = `biome check .`); las reglas de *no literal strings* y de nombres de archivo quedan por revisión (Biome no tiene equivalente todavía, ver T005).
- `npm run i18n:check` verde (paridad es/en de claves).
- `npm run build` verde con `VITE_API_MODE=mock` y con `VITE_API_MODE=http`; el bundle *http* no debe contener código de `src/mocks/`.
- Presupuesto de rendimiento objetivo: JS inicial de la ruta pública ≤ ~200 KB gzip; el bundle de admin y las librerías de gráficos/exportación se cargan bajo demanda.
- Accesibilidad básica: foco visible, `label` en todo input, contraste AA, objetivos táctiles ≥ 44 px.

### Gobernanza
Cambios a la constitución requieren actualizar la versión y revisar `plan.md` (*Constitution Check*). Las violaciones justificadas se registran en *Complexity Tracking*.

---

## 2. Especificación (`spec.md`)

### 2.1 Contexto y objetivo

Scan VKFit reemplaza la tabla de medidas estática de Vikinga por una recomendación de talle determinista a partir de cinco medidas (altura, busto, cintura, cadera, torso) y una línea de prenda (Endurance, Soft, Jammer, Sunga, Kids). Sobre esa recomendación se ofrece un catálogo filtrado por stock real, coordinación de compra por Email/WhatsApp con reserva optimista de stock, feedback gamificado, y un panel administrativo con KPIs, inventario y analítica de demanda no satisfecha.

**Objetivo del prototipo:** un FE navegable de punta a punta (cliente y administrador) que permita **validar el alcance funcional con el cliente**, alimentado por datos mock y con una capa de datos lista para conectarse a la API REST.

**Fuera de alcance:** backend real, PWA (service worker/manifest/offline), envío real de emails/WhatsApp desde servidor, pagos, notificaciones push, TypeScript.

### 2.2 Actores

| Actor | Descripción |
|---|---|
| **Invitado** | Sin sesión. Puede obtener talle y explorar catálogo. No puede coordinar compra. |
| **Cliente** | Usuario registrado (`type = Customer`). Perfiles, direcciones, compras, feedback, puntos. |
| **Administrador** | Personal de Vikinga (`type = Admin`). Mismo formulario de login que el cliente. |

### 2.3 Historias de usuario

Cada historia es independiente y testeable por sí sola (formato spec-kit).

#### US1 — Obtener mi talle sin registrarme (P1)
**Por qué:** el valor se entiende al ver el talle; pedir datos antes es perder al usuario.
**Test independiente:** entrar a `/`, elegir "probar sin registrarme", cargar 5 medidas y ver un talle sugerido.
- **Dado** un invitado en la pantalla de inicio, **cuando** elige probar el sistema, **entonces** llega a la pantalla de medición sin pedir datos personales.
- **Dado** un QR con `/fit?line=endurance`, **cuando** lo abre, **entonces** aterriza en la medición con la línea Endurance preseleccionada (y también acepta `linea=` por compatibilidad con la doc técnica).
- **Dado** cinco medidas válidas, **cuando** envía, **entonces** ve el talle sugerido, la línea y si hay stock en ese talle.
- **Dado** un invitado con talle obtenido, **entonces** ve un llamado a registrarse que enumera beneficios (guardar medidas, ver stock, ganar cupones).
- **Dado** medidas fuera de todos los rangos de la línea, **entonces** ve un mensaje explícito de "fuera de rango" (sin talle inventado).

#### US2 — Crear cuenta, iniciar sesión y no perder lo hecho (P1)
**Test independiente:** como invitado con un talle obtenido, registrarse y verificar que la generación aparece en el historial de la cuenta nueva.
- Registro con datos personales y teléfono WhatsApp **obligatorio**.
- Login único para clientes y admins (redirige según rol), con recuperación de credenciales y acceso por OTP.
- Migración automática de datos del invitado (`guest_session_id`) al registrarse (y al iniciar sesión, ver Q-05).
- Al intentar coordinar compra sin sesión, redirección a registro con enlace "¿Ya tienes una cuenta? Iniciar sesión" y retorno al punto donde estaba.

#### US3 — Ver solo lo que hay en mi talle (P1)
**Test independiente:** con un talle sugerido con stock, el catálogo lista únicamente productos con unidades disponibles en ese talle; con un talle sin stock se muestra el estado explícito.
- Los productos agotados en el talle no aparecen; el color agotado no es seleccionable.
- **Sin stock en ningún color:** mensaje explícito + (a) suscribirse a aviso de reposición y (b) ver talles adyacentes (uno arriba y uno abajo) con leyenda clara de que **no** son el talle recomendado.
- Cada consulta sin stock queda registrada para el reporte de demanda no satisfecha.

#### US4 — Coordinar la compra por Email o WhatsApp (P1)
**Test independiente:** cliente logueado elige producto/color/talle, entrega y canal, confirma, y ve la venta "Pendiente de coordinación" con el stock reservado.
- Método de entrega: retiro en local o envío a domicilio (elige una dirección guardada o crea una).
- Canal: Email (por defecto) o WhatsApp; el mensaje se arma solo con producto, talle, color, entrega y datos del cliente.
- Al confirmar: se crea la venta en `PendingCoordination` y se reserva stock; el canal **no muta** durante el ciclo de vida.
- Si entre el catálogo y la confirmación se agotó la unidad, se informa el conflicto sin perder el carrito.
- Cupón opcional (ver Q-07).

#### US5 — Perfiles de medidas y direcciones (P2)
**Test independiente:** crear dos perfiles ("Entrenamiento", "Hijo"), alternar con el selector global y verificar que el formulario de medición se precarga y el historial se separa por perfil.
- Selector de perfil siempre visible para clientes logueados; perfil por defecto.
- Agenda de direcciones: alta, edición, baja, dirección por defecto.
- Guardar las medidas de un resultado como perfil desde la pantalla de resultado.

#### US6 — Feedback, puntos, cupones e historial (P2)
**Test independiente:** calificar un talle (chico/correcto/grande) con comentario opcional, ver si se otorgan puntos, canjearlos por un cupón y verlo en "mis cupones".
- Feedback desacoplado de la compra; una calificación por generación.
- Cálculo probabilístico de puntos con límite diario (parámetros administrables).
- Canje de puntos por cupón (porcentaje o monto fijo).
- Historial cronológico de generaciones (por perfil), con acceso a calificar las pendientes.

#### US7 — (Admin) Gestionar ventas en curso con reserva de stock (P1)
**Test independiente:** una venta pendiente pasa a Contactado y luego a Confirmada (descuenta stock físico) o a Cancelada (libera reserva al instante).
- Listado de ventas con estado, logística, teléfono y **canal** (Email/WhatsApp) visibles.
- Transiciones: `PendingCoordination → Contacted → Confirmed`; `Cancelled` en cualquier momento previo a la confirmación.
- Confirmar genera el movimiento de stock `SaleConfirmed`; cancelar no requiere ajuste (la reserva se libera).

#### US8 — (Admin) Dashboard de control (P2)
**Test independiente:** el dashboard muestra los cuatro bloques con datos de la seed y respeta el filtro de fechas.
- Conversión = generaciones vs. compras coordinadas.
- Precisión = % de feedback "Correcto", **separando** quienes compraron de quienes solo consultaron.
- Stock crítico = variantes con disponible por debajo del mínimo.
- Ventas en vuelo con logística, teléfono y canal.

#### US9 — (Admin) Inventario y catálogo (P2)
**Test independiente:** ajustar stock de una variante exige motivo y deja un movimiento auditable; el catálogo cliente refleja el cambio.
- Granularidad Producto + Color + Talle (variante con SKU único).
- Motivos: Ingreso de mercadería, Cambio por talle, Pérdida/Defectuoso, Ajuste manual (más `SaleConfirmed` automático, solo lectura).
- CRUD de productos y variantes (baja lógica).

#### US10 — (Admin) Demanda no satisfecha y comentarios (P3)
**Test independiente:** el mapa de talles faltantes agrega consultas sin stock por línea × talle; los comentarios se filtran; ambos se exportan a CSV y Excel.

#### US11 — (Admin) Reglas del juego y cupones (P3)
**Test independiente:** cambiar `success_probability` a 100 % hace que todo feedback otorgue puntos; el costo de canje de un cupón se edita y se refleja en el cliente.

#### US12 — (Admin) Modo asistente "Para terceros" (P3)
**Test independiente:** con el switch activo se genera un talle que **no** aparece en el historial ni en las métricas personales del admin; opcionalmente se vincula a un cliente registrado.

### 2.4 Requisitos funcionales

**Acceso y navegación**
- **FR-001** Pantalla de inicio con tres caminos: iniciar sesión, crear cuenta, probar sin registrarse.
- **FR-002** Landing informativa accesible por menú y como destino de QR genéricos.
- **FR-003** Deep linking a la medición con línea preseleccionada; el origen (`Direct | QR | Landing`) se registra en la generación.
- **FR-004** Guards de ruta por sesión y por rol; redirección a `login` con `returnTo`.

**Talle**
- **FR-005** Formulario de 5 medidas + línea (+ tipo de calce si se confirma, ver Q-02) con validación de rango razonable y ayuda "cómo medirme".
- **FR-006** El talle lo calcula la capa de datos (mock controller), nunca el componente.
- **FR-007** El resultado indica talle, medida dominante, disponibilidad de stock y adyacentes si aplica.
- **FR-008** Invitado identificado por `guest_session_id` persistente en el dispositivo.

**Cuenta**
- **FR-009** Registro con nombre, email, contraseña y WhatsApp obligatorio (datos demográficos a confirmar, Q-08).
- **FR-010** Login unificado, recuperación de credenciales y OTP.
- **FR-011** Multi-perfil de medidas con selector global; multi-dirección.

**Catálogo y compra**
- **FR-012** Catálogo filtrado por línea y talle con stock disponible (`disponible = físico − reservado`).
- **FR-013** Estado sin stock con suscripción a reposición y talles adyacentes rotulados.
- **FR-014** Checkout: entrega (retiro/envío + dirección), canal (Email por defecto / WhatsApp), resumen, cupón opcional.
- **FR-015** Al confirmar se crea la venta `PendingCoordination`, se reserva stock y se genera el mensaje/enlace del canal elegido.
- **FR-016** Requiere cuenta: el invitado es redirigido a registro/login.

**Feedback y puntos**
- **FR-017** Calificación Chico/Correcto/Grande + comentario libre opcional, sin exigir compra.
- **FR-018** Puntos por feedback con probabilidad, cantidad y tope diario configurables.
- **FR-019** Canje de puntos por cupón; cupones propios visibles y aplicables en checkout.
- **FR-020** Historial de generaciones por perfil.

**Administración**
- **FR-021** Dashboard con 4 bloques de KPIs y filtro de fechas.
- **FR-022** Gestión de ventas con máquina de estados, reserva y confirmación/cancelación.
- **FR-023** Inventario por variante, ajustes con motivo obligatorio y trazabilidad.
- **FR-024** CRUD de productos/variantes.
- **FR-025** Mapa de talles faltantes, análisis de comentarios y exportación a CSV y Excel.
- **FR-026** Configuración de reglas de puntos y costos de canje.
- **FR-027** Modo asistente "Para terceros" con vínculo manual opcional a cliente.

**Transversales**
- **FR-028** Toda la UI disponible en español e inglés, con cambio de idioma persistente.
- **FR-029** Estados de carga, vacío y error consistentes en toda pantalla con datos.
- **FR-030** Mobile-first: todas las pantallas de cliente usables a 360 px; admin utilizable en móvil y cómodo en escritorio.
- **FR-031** La capa de datos alterna mock ↔ HTTP por configuración.

### 2.5 Casos borde

- Dos clientes intentan reservar la última unidad: el segundo recibe conflicto `STOCK_INSUFFICIENT` al confirmar.
- Medidas entre rangos (huecos) o por encima/debajo de todos los talles.
- Limpieza de almacenamiento del navegador: se pierde el `guest_session_id` (aceptable, se crea uno nuevo).
- Cupón vencido, inactivo, sin usos o no aplicable al producto.
- Se alcanzó el límite diario de feedback con puntos: el feedback se guarda, los puntos no se otorgan y se informa.
- Eliminar un perfil o dirección con historial/ventas asociadas: baja lógica.
- Sesión expirada (401) durante una acción: redirección a login y retorno.
- Cliente intenta re-calificar una generación ya calificada: no permitido.
- Admin intenta cancelar una venta ya confirmada: no permitido.
- Ventas pendientes que retienen stock indefinidamente (sin TTL en el alcance): el admin ve la antigüedad resaltada (Q-11).

### 2.6 Criterios de éxito (medibles)

- **SC-001** Un invitado obtiene su talle en ≤ 3 pantallas y < 60 s desde `/`.
- **SC-002** El recorrido completo cliente (medir → catálogo → coordinar) se completa sin errores con la seed.
- **SC-003** El recorrido admin (venta pendiente → contactada → confirmada) actualiza inventario y catálogo cliente sin recargar manualmente el mock.
- **SC-004** 100 % de las claves i18n existen en es y en; 0 literales visibles (lint).
- **SC-005** Cambiar `VITE_API_MODE` a `http` no requiere tocar componentes ni hooks (verificable por `git diff`).
- **SC-006** Lighthouse mobile ≥ 90 (performance) en `/` y `/fit` con build de producción.

---

## 3. Investigación y decisiones (`research.md`)

| # | Tema | Decisión | Alternativas descartadas y motivo |
|---|---|---|---|
| R-01 | Lenguaje | **JavaScript + JSX** con JSDoc (`@typedef`) para DTOs. Coherente con los ejemplos `.jsx` de `CLAUDE.md`. | TypeScript: no está en las reglas; se puede migrar luego porque los contratos están tipados en JSDoc. |
| R-02 | Capa de datos | **`services → apiClient → transport (mock \| http)`**, con *controllers* mock que se registran en un **router REST simulado** (método + path + params + body + auth → `{status, data}`). | (a) Mocks directos en hooks: se filtran a la UI. (b) MSW: excelente fidelidad, pero agrega service worker (choca con la regla "sin SW por ahora") y complejidad de setup. Queda como opción futura, porque el contrato ya es REST. |
| R-03 | Server-state | **TanStack Query**: caché, invalidación tras mutaciones (crítico para "confirmo venta → cambia el catálogo"), reintentos, estados `isPending/isError`. Además facilita persistencia offline futura. | `useEffect + fetch` a mano: más código y sin invalidación. |
| R-04 | Routing | **React Router** (data router con `lazy` por ruta). | TanStack Router: válido, pero menos estándar en el equipo. |
| R-05 | Formularios | `@mantine/form` + **zod** (`mantine-form-zod-resolver`) para validación de formato. | Formik/RHF: duplican lo que ya da Mantine. |
| R-06 | i18n | **Provider propio liviano** que expone `useI18n()` (`t`, `locale`, `setLocale`, `formatNumber/Date/Currency`) con interpolación `{{var}}` y plural vía `Intl.PluralRules`. Locales en `src/i18n/locales/{es,en}.js`. Script de paridad (`i18n:check`); la regla de *no literal strings* queda por revisión manual (iteración 8: el lint pasó a Biome, que no la tiene). | i18next/react-i18next: correcto pero más peso y la regla pide el hook `useI18n()`; se puede envolver después sin tocar componentes. |
| R-15 | Sesión | `AuthContext` (usuario, token, rol) + `ActiveProfileContext` (perfil activo). Token en `localStorage` (solo prototipo). | Zustand/Redux: innecesario para 2 contextos pequeños (principio VIII). |
| R-07 | Persistencia mock | Base en memoria con **persistencia en `localStorage`** (`vkfit.mockdb.v1`) + botón de reset. Permite que "reservar → recargar → seguir" funcione en demos. | Solo memoria: pierde el estado al recargar y estropea la demo. |
| R-08 | Gráficos | `@mantine/charts` (Recharts) cargado **lazy** solo en rutas admin. El mapa de calor se implementa con `Table` + celdas coloreadas (no requiere librería). | Chart.js/Nivo: dependencia extra. |
| R-09 | Exportación | CSV propio (Blob) + Excel con librería liviana cargada con `import()` bajo demanda (p. ej. `write-excel-file`). | SheetJS desde el registro npm: versión desactualizada del paquete `xlsx` (verificar antes de usarla). `exceljs`: demasiado pesado para PWA. |
| R-10 | Íconos | `@tabler/icons-react` (import nominal, tree-shakeable). | — |
| R-11 | Tests | **Vitest** + Testing Library para dominio, controllers, router mock, i18n y unos pocos componentes críticos. | E2E completo (Playwright): opcional en fase final. |
| R-12 | Contacto/mensaje | El *controller* compone el mensaje (asunto/cuerpo/URL `mailto:` o `https://wa.me/<n>?text=`) y lo devuelve en la respuesta de `POST /sales`; el FE solo lo abre. Destinos en `SETTING`. | Componerlo en el FE: duplicaría lógica que en producción vive en el servidor y complicaría i18n (el destinatario es Vikinga, no el cliente). |
| R-13 | Tema | Paleta placeholder "vikinga" (10 tonos) en `createTheme`, tipografía del sistema. **Reemplazar por la paleta de marca.** | Fuentes web: costo de carga sin necesidad. |
| R-14 | Motor de talles (mock) | Regla propuesta: para cada medida se busca el talle cuyo rango la contiene (si cae en un hueco, se toma el siguiente mayor); el **talle final es el más grande de los cinco** (la medida más exigente dicta). Si una medida excede el máximo del mayor talle o queda bajo el mínimo del menor → `OUT_OF_RANGE`. Se devuelve `dominantMeasure` para explicar el resultado. | Ver Q-01: falta la matriz real y validar la regla con el cliente. |

---

## 4. Plan técnico (`plan.md`)

### 4.1 Contexto técnico

| Ítem | Valor |
|---|---|
| Lenguaje / runtime | JavaScript (ES2022), JSX, Node LTS para tooling |
| Framework | React (última estable) + Vite |
| UI | Mantine (`core`, `hooks`, `form`, `notifications`, `modals`, `dates`, `charts`) — versión y API según `agents/llms-full.txt` |
| Routing / datos | React Router, TanStack Query |
| Validación | zod |
| Testing | Vitest, Testing Library, jsdom |
| Plataforma objetivo | Navegadores móviles modernos; escritorio para admin |
| Tipo de proyecto | SPA frontend única (sin backend en el repo) |
| Objetivos de rendimiento | Ver constitución (JS inicial ≤ ~200 KB gzip, Lighthouse mobile ≥ 90) |
| Restricciones | Sin PWA aún; rutas en inglés; i18n total; nombres kebab-case/PascalCase |
| Escala | ~30 pantallas, seed de ~150 variantes, ~40 generaciones históricas |

### 4.2 Constitution Check

| Principio | Estado | Cómo se cumple |
|---|---|---|
| I Mantine primero | ✅ | Tarea previa en cada épica: leer secciones de `agents/llms-full.txt`; sin otras libs de UI |
| II Nombres | ⚠️ | Convención en `CLAUDE.md` + revisión (Biome no tiene regla de nombres de archivo) |
| III i18n | ⚠️ | `useI18n()`, `i18n:check` + test de paridad; **sin** lint `no-literal-string` (Biome no lo tiene) |
| IV Rutas en inglés | ✅ | `routes.js` único; test que verifica que todos los paths son ASCII en inglés |
| V PWA-ready sin PWA | ✅ | Lazy routes, skeletons, sin SW/manifest; Query como capa de datos |
| VI FE agnóstico | ✅ | `noRestrictedImports` de Biome para `**/mocks/**` y `@mocks/**` fuera de `src/api/` y `src/mocks/` |
| VII Sin lógica de negocio | ✅ | Motor de talles, puntos y stock en `src/mocks/domain/` |
| VIII Simplicidad | ✅ | 2 contextos, sin store global |
| IX Verificable | ✅ | Tests de dominio y del router mock |

*Complexity Tracking:* sin violaciones.

### 4.3 Arquitectura de datos (mock intercambiable por REST)

```
Componente  →  hook (use-*.js, TanStack Query)  →  service (*-service.js)
                                                        │
                                                   apiClient.request({method,url,params,body})
                                                        │
                            ┌───────────────────────────┴───────────────────────────┐
                    VITE_API_MODE=mock                                    VITE_API_MODE=http
                    mock-transport.js                                     http-transport.js (fetch)
                            │                                                       │
                    mock-router.js  ──►  *.controller.js  ──►  domain/*  ──►  db   API real
                    (latencia, auth, errores como HTTP)        (reglas)       (localStorage)
```

**Reglas de la capa:**

1. Los *services* conocen **solo** paths, métodos y DTOs del contrato (§6). No saben si hay mock.
2. `apiClient` selecciona el transporte con `import.meta.env.VITE_API_MODE`; el import del transporte mock es dinámico y queda eliminado del build *http* (verificable en el bundle).
3. Los *controllers* mock tienen la forma de handlers de servidor: `(req) => ({ status, data, meta })`, donde `req = { params, query, body, auth: { user }, guestSessionId }`. Lanzan `ApiError(status, code, details)` como lo haría el backend.
4. Errores: el FE nunca muestra `message` del servidor; traduce `error.code` a `errors.<CODE>` con `useI18n()`.
5. Auth: `Authorization: Bearer <token>` y `X-Guest-Session-Id` en cada request; `401` dispara logout + redirect con `returnTo`.
6. Latencia simulada (`VITE_MOCK_LATENCY_MS`, por defecto 250–600 ms aleatorios) y tasa de fallos opcional (`VITE_MOCK_FAIL_RATE`) para probar estados de carga/error.

**Esqueleto de referencia (para orientar la implementación):**

```js
// src/api/client/api-client.js
import { httpTransport } from './http-transport';
const getTransport = async () =>
  import.meta.env.VITE_API_MODE === 'http'
    ? httpTransport
    : (await import('../../mocks/mock-transport')).mockTransport;

export const apiClient = {
  request: async (config) => (await getTransport()).send(withAuthHeaders(config)),
  get: (url, params) => apiClient.request({ method: 'GET', url, params }),
  post: (url, body) => apiClient.request({ method: 'POST', url, body }),
  patch: (url, body) => apiClient.request({ method: 'PATCH', url, body }),
  put: (url, body) => apiClient.request({ method: 'PUT', url, body }),
  delete: (url) => apiClient.request({ method: 'DELETE', url }),
};

// src/api/services/sales-service.js
export const salesService = {
  create: (payload) => apiClient.post('/sales', payload),
  listMine: (params) => apiClient.get('/me/sales', params),
};

// src/features/checkout/hooks/use-create-sale.js
export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  });
};

// src/mocks/controllers/sales.controller.js
register('POST', '/sales', createSale, { auth: 'customer' });
```

### 4.4 Estructura del proyecto

```
.
├── CLAUDE.md
├── agents/llms-full.txt                 # docs de Mantine
├── .specify/memory/constitution.md
├── specs/001-scan-vkfit-fe-prototype/   # spec, plan, research, data-model, contracts, quickstart, tasks
├── scripts/check-i18n.mjs               # paridad de claves es/en
├── .env.example · jsconfig.json · biome.json
├── vite.config.js · vite.aliases.js · vitest.config.js
└── src/
    ├── main.jsx
    ├── app/
    │   ├── app.jsx · providers.jsx · router.jsx
    │   ├── routes.js                    # constantes de paths (inglés) + helpers
    │   └── guards/ require-auth.jsx · require-role.jsx · guest-only.jsx
    ├── config/ env.js · features.js     # flags (p. ej. fitType, devTools)
    ├── constants/ enums.js · lines.js
    ├── theme/ theme.js
    ├── i18n/
    │   ├── i18n-provider.jsx · use-i18n.js
    │   └── locales/ es.js · en.js
    ├── api/
    │   ├── client/ api-client.js · http-transport.js · api-error.js
    │   └── services/ auth-service.js · profiles-service.js · addresses-service.js
    │                 catalog-service.js · size-service.js · sales-service.js
    │                 rewards-service.js · alerts-service.js
    │                 admin-sales-service.js · admin-inventory-service.js
    │                 admin-catalog-service.js · admin-analytics-service.js
    │                 admin-settings-service.js · admin-coupons-service.js
    ├── mocks/                            # DESCARTABLE al conectar la API real
    │   ├── mock-transport.js · router/mock-router.js
    │   ├── controllers/ *.controller.js  # uno por recurso (ver §6)
    │   ├── domain/ size-engine.js · stock.js · points.js · coordination-message.js · sale-state-machine.js
    │   ├── db/ database.js · persistence.js · seed/*.js
    │   └── dev/ dev-tools.jsx            # reset de DB, cambio de usuario (solo modo mock)
    ├── components/                       # compartidos
    │   ├── layout/ public-layout.jsx · customer-layout.jsx · admin-layout.jsx
    │   ├── feedback/ query-boundary.jsx · empty-state.jsx · error-state.jsx · skeletons.jsx
    │   ├── page-header.jsx · language-switch.jsx · profile-selector.jsx
    │   ├── size-badge.jsx · stock-badge.jsx · sale-status-badge.jsx · channel-badge.jsx
    │   ├── responsive-list.jsx           # Table en desktop, Cards en móvil
    │   └── money.jsx · date-time.jsx
    ├── features/
    │   ├── home/ (home-page, about-page)
    │   ├── auth/ (login, register, forgot-password, otp, auth-context)
    │   ├── fit/ (fit-page, fit-form, measure-help, result-page, out-of-range, save-profile-modal)
    │   ├── catalog/ (catalog-page, product-card, product-detail, no-stock-state, adjacent-sizes, restock-subscribe)
    │   ├── checkout/ (checkout-page, delivery-step, channel-step, summary-step, confirmation-page, coupon-input)
    │   ├── account/ (profiles-page, addresses-page, history-page, orders-page, alerts-page, rewards-page, my-coupons)
    │   ├── feedback/ (feedback-drawer, points-toast)
    │   └── admin/ (dashboard, sales, inventory, catalog-admin, analytics, settings, coupons, assistant)
    ├── hooks/ use-media.js · use-export.js
    ├── utils/ format.js · download.js · query-keys.js
    └── test/ setup.js
```

### 4.5 Rutas (todas en inglés, definidas en `src/app/routes.js`)

| Grupo | Ruta | Pantalla | Acceso |
|---|---|---|---|
| Público | `/` | Home: login / registro / probar sin registrarse | Todos |
| | `/about` | Landing informativa (destino de QR genéricos, `?src=landing` al ir a medir) | Todos |
| | `/login` · `/login/otp` · `/forgot-password` · `/reset-password` · `/register` | Autenticación | Solo sin sesión (excepto registro desde invitado) |
| Talle | `/fit` (`?line=endurance`, alias `linea`, `?src=`) | Formulario de medición | Invitado / Cliente |
| | `/fit/result/:generationId` | Resultado + CTA de registro + feedback | Invitado / Cliente |
| Catálogo | `/catalog` (`?line=&size=&generation=`) | Catálogo filtrado / sin stock / adyacentes | Invitado / Cliente |
| | `/catalog/:productId` | Detalle: color y talle | Invitado / Cliente |
| Compra | `/checkout` | Entrega → canal → resumen | Cliente (invitado → `/register?returnTo=`) |
| | `/checkout/confirmation/:saleId` | Confirmación + abrir canal | Cliente |
| Cuenta | `/account/profiles` · `/account/addresses` · `/account/history` · `/account/orders` · `/account/alerts` · `/account/rewards` | Gestión personal | Cliente |
| Admin | `/admin` | Dashboard | Admin |
| | `/admin/sales` · `/admin/sales/:saleId` | Ventas | Admin |
| | `/admin/inventory` · `/admin/inventory/movements` | Stock y auditoría | Admin |
| | `/admin/products` | CRUD productos/variantes | Admin |
| | `/admin/analytics/missing-sizes` · `/admin/analytics/comments` | Demanda no satisfecha | Admin |
| | `/admin/coupons` · `/admin/settings` | Reglas del juego | Admin |
| | `/admin/assistant` | Modo "Para terceros" (reusa `fit-form`) | Admin |
| Dev | `/dev` | Herramientas de demo (solo `VITE_API_MODE=mock`) | Todos |

`/fit` respeta la doc técnica (`/fit?linea=endurance`); el ejemplo de `CLAUDE.md` usa `/generator`. Al estar centralizado, renombrar es un cambio de una línea (Q-10).

### 4.6 UI: layouts y componentes Mantine sugeridos

- **Shell cliente (mobile-first):** `AppShell` con header (logo, `ProfileSelector`, `LanguageSwitch`, menú de cuenta) y **barra inferior** en móvil (Medir · Catálogo · Historial · Cuenta).
- **Shell admin:** `AppShell` con navbar colapsable (`Burger` en móvil) y header con usuario/idioma.
- **Fit:** `SegmentedControl`/`Chip.Group` para línea, `NumberInput` ×5 con sufijo cm, `Drawer` "cómo medirme", `Button` fijo inferior en móvil.
- **Resultado:** `Card` con talle destacado, `Alert` de stock, `Badge` de medida dominante, CTA de registro (invitado) o de guardar perfil/feedback (cliente).
- **Catálogo:** `SimpleGrid` responsive, `ColorSwatch` para colores, `Chip` de filtro, `Skeleton` en carga, `Alert` + `Tabs` (aviso/adyacentes) en sin stock.
- **Checkout:** `Stepper` (móvil: vertical o `Accordion`), `SegmentedControl` (entrega y canal), `Select` de dirección, `TextInput` de cupón, resumen con `Table`.
- **Admin:** `Tabs` por estado, `Table` (desktop) / `Card` (móvil) vía `responsive-list`, `Drawer` de detalle, `Menu` de acciones, `Modal` de confirmación (`@mantine/modals`), `RingProgress`/`BarChart` para KPIs, `Table` coloreada para el mapa de calor, `DatePickerInput` para rango.
- **Estados:** `query-boundary.jsx` unifica `Skeleton` / `EmptyState` / `ErrorState` (con reintento).
- **Rendimiento:** rutas con `lazy`, admin en chunk separado, `@mantine/charts` y exportación con `import()`; imágenes de producto como placeholders SVG/CSS (sin assets pesados).

### 4.7 i18n

- Estructura de claves: `common.*`, `nav.*`, `auth.*`, `fit.*`, `catalog.*`, `checkout.*`, `account.*`, `rewards.*`, `admin.<área>.*`, `enums.<enum>.<valor>` (p. ej. `enums.saleStatus.PendingCoordination`), `errors.<CODE>`, `validation.*`.
- Idioma por defecto `es` (Uruguay); detección inicial por navegador; persistido en `localStorage`.
- Formatos con `Intl` (`es-UY` / `en`): fechas, números y moneda **UYU**.
- El contenido de datos (nombres de producto, colores, comentarios de clientes, nombres de perfil) es *dato*, no UI: no se traduce.
- Las etiquetas de enums y los códigos de error **siempre** se resuelven por clave; los valores de enum viajan en el formato del ERD (`PendingCoordination`, `Correct`, etc.).

### 4.8 Estrategia de mock data (seed)

Objetivo: que cada pantalla y cada caso borde sea demostrable sin preparar datos a mano.

- **Usuarios:** 1 admin, 2 clientes (uno con perfiles/direcciones/puntos, otro vacío). Credenciales demo visibles en `/login` solo en modo mock. OTP fijo `123456` en mock.
- **Talles:** 5 líneas; matriz **placeholder** con rangos contiguos (Kids con talles infantiles). *Reemplazar por la matriz oficial de Vikinga (Q-01).*
- **Catálogo:** ~12 productos (2–3 por línea), variantes producto × talle × 2–3 colores.
- **Casos sembrados a propósito:**
  - Endurance talle M sin stock en ningún color → flujo "sin stock" + adyacentes + aviso de reposición.
  - Una variante con `disponible = 1` → prueba de carrera/conflicto.
  - Variantes por debajo del mínimo → alertas de stock crítico.
  - Ventas en cada estado (`PendingCoordination`, `Contacted`, `Confirmed`, `Cancelled`), en ambos canales y ambos métodos de entrega, una con antigüedad > 3 días.
  - ~40 generaciones repartidas en 60 días con calificaciones y comentarios, algunas vinculadas a una venta y otras no (para separar precisión "compró" vs "solo consultó"), varias con `stock_available_at_query = false`.
  - Cupones: uno de porcentaje, uno de monto fijo, uno vencido, plantillas canjeables con `points_cost`.
- **Fechas relativas a "hoy"** (la seed se genera al inicializar) para que los rangos del dashboard siempre tengan datos.
- Motor con `Math.random` inyectable para tests deterministas del sorteo de puntos.

### 4.9 Estrategia de pruebas

| Nivel | Qué | Herramienta |
|---|---|---|
| Unitario dominio | `size-engine` (rango, huecos, fuera de rango, dominante), `stock` (reservado/disponible), `points` (probabilidad, tope diario), `sale-state-machine` (transiciones válidas/ inválidas), `coordination-message` | Vitest |
| Controllers | Cada endpoint del contrato: éxito, 401/403/404/409/422 | Vitest sobre `mock-router` |
| i18n | Paridad de claves es/en, sin claves huérfanas | Script + test |
| Rutas | Todos los paths de `routes.js` en inglés y únicos | Vitest |
| Componentes críticos | `fit-form`, `no-stock-state`, `checkout`, `sale-actions` | Testing Library |
| Recorrido | Checklist manual de `quickstart.md`; opcional Playwright smoke de US1→US4→US7 | Manual / Playwright |

---

## 5. Modelo de datos (`data-model.md`)

Derivado 1:1 del ERD. Los DTO del contrato usan **camelCase** (traducción mecánica de `snake_case`; ver Q-13). Los enums conservan los valores del ERD.

### 5.1 Enums (`src/constants/enums.js`)

| Enum | Valores |
|---|---|
| `UserType` | `Admin`, `Customer` |
| `Line` | `Endurance`, `Soft`, `Jammer`, `Sunga`, `Kids` (slug URL en minúsculas) |
| `FitType` | `Training`, `Competition` (solo ERD, Q-02) |
| `GenerationSource` | `Direct`, `QR`, `Landing` |
| `Rating` | `Small`, `Correct`, `Large` |
| `SaleStatus` | `PendingCoordination`, `Contacted`, `Confirmed`, `Cancelled` |
| `Channel` | `Email`, `Whatsapp` |
| `DeliveryMethod` | `StorePickup`, `HomeDelivery` |
| `TransactionDirection` | `Inbound`, `Outbound` |
| `TransactionReason` | `GoodsReceipt`, `SizeExchange`, `LossDefective`, `ManualAdjustment`, `SaleConfirmed` |
| `AlertType` | `CriticalStock`, `RestockNotice` |
| `AlertStatus` | `Active`, `Notified`, `Closed` |
| `DiscountType` | `Fixed`, `Percentage` |
| `PointsMovementType` | `Feedback`, `Redemption`, `Adjustment` |

### 5.2 Entidades (colecciones del mock DB)

| Entidad | Campos clave / notas de FE |
|---|---|
| **User** | `id, type, name, email, passwordHash*, whatsappPhone, otpCode?*, otpExpiresAt?*, pointsBalance, createdAt`. (*) Nunca salen en respuestas. |
| **MeasurementProfile** | `id, userId, name, height, bust, waist, hip, torso, isDefault`. Un solo default por usuario. |
| **Address** | `id, userId, street, number, city, department, reference, isDefault` (+ `active` para baja lógica). |
| **Size** | `id, line, code, sortOrder, {height,bust,waist,hip,torso}{Min,Max}`. `sortOrder` define adyacentes. |
| **Product** | `id, line, model, description, price, active`. |
| **ProductVariant** | `id, productId, sizeId, color, sku (único), quantity (físico), minStock, active`. |
| **SizeGeneration** | `id, customerId?, guestSessionId?, profileId?, adminId?, line, createdAt, height, bust, waist, hip, torso, suggestedSizeId, stockAvailableAtQuery, rating?, comment?, ratedAt?, fitType, source`. Regla: exactamente uno entre `customerId` / `guestSessionId`; en modo asistente `adminId` está presente y `customerId` solo si se vincula. |
| **Sale** | `id, userId, couponId?, addressId? (null si StorePickup), generationId?, createdAt, status, channel, deliveryMethod, contactedAt?, confirmedAt?, cancelledAt?` |
| **SaleLine** | `id, saleId, variantId, quantity, unitPrice` |
| **DiscountCoupon** | `id, productId?, userId? (dueño si fue canjeado), couponCode, usageCount, discountType, discountValue, maxDiscount, pointsCost?, validFrom, validUntil, active` |
| **Transaction** | `id, userId (quién lo registró), saleId?, direction, reason, createdAt` |
| **TransactionLine** | `id, transactionId, variantId, quantity` |
| **Alert** | `id, variantId, userId? (solo RestockNotice), alertType, notificationMode, status, createdAt` |
| **PointsMovement** | `id, userId, generationId?, couponId?, points (±), type, createdAt` |
| **Setting** | `key, value, updatedAt`. Claves: `success_probability`, `points_per_feedback`, `max_daily_feedback` (ERD) + `coordination_email`, `coordination_whatsapp` (extensión, Q-09). |

### 5.3 Reglas derivadas (implementadas en `mocks/domain/`, nunca en componentes)

- **Reservado(variante)** = Σ `SaleLine.quantity` de ventas en `PendingCoordination` o `Contacted`.
- **Disponible(variante)** = `quantity − reservado`. El catálogo cliente usa `disponible > 0`.
- **Stock crítico** = variantes activas con `disponible < minStock`.
- **Crear venta** (atómico): valida `disponible ≥ cantidad` por línea → si no, `409 STOCK_INSUFFICIENT`. Crea `Sale` + `SaleLine` y, si hay cupón válido, incrementa `usageCount`.
- **Confirmar venta**: solo desde `Contacted`; crea `Transaction(Outbound, SaleConfirmed, saleId)` + líneas y descuenta `quantity`.
- **Cancelar venta**: permitido desde `PendingCoordination` o `Contacted`; no hay ajuste de stock (la reserva es derivada, se libera al instante); decrementa `usageCount` del cupón si aplicaba.
- **Talle sugerido**: ver R-14; `stockAvailableAtQuery` = existe alguna variante activa de la línea en ese talle con `disponible > 0`.
- **Adyacentes**: talles con `sortOrder ± 1` de la misma línea.
- **Feedback**: una sola vez por generación. Si el usuario está autenticado, no superó `max_daily_feedback` y el sorteo `random < success_probability/100` acierta → `PointsMovement(Feedback, +points_per_feedback)` y `user.pointsBalance += points`.
- **Canje**: requiere `pointsBalance ≥ pointsCost`; crea una copia del cupón plantilla con `userId` dueño y código único, y `PointsMovement(Redemption, −pointsCost, couponId)`.
- **Reposición**: al registrar una `Transaction(Inbound)` que lleva una variante de `disponible = 0` a `> 0`, las `Alert(RestockNotice, Active)` de esa variante pasan a `Notified` y el cliente ve un aviso in-app.
- **Migración de invitado**: reasigna `SizeGeneration.guestSessionId → customerId` y crea el perfil por defecto con el nombre recibido del FE.
- **Modo asistente**: `SizeGeneration.adminId` presente; se excluye de historial y métricas personales del admin; las métricas globales sí las incluyen.

### 5.4 Máquina de estados de venta

```
PendingCoordination ──► Contacted ──► Confirmed   (descuenta stock físico)
        │                   │
        └───────┬───────────┘
                ▼
            Cancelled   (libera reserva; no válido desde Confirmed)
```
Definida como tabla de transiciones en `sale-state-machine.js` para ajustarla fácilmente (Q-04).

---

## 6. Contratos (`contracts/`)

### 6.1 Convenciones

- Base: `VITE_API_BASE_URL` (p. ej. `/api/v1`). JSON, fechas ISO-8601 UTC, dinero como número en UYU.
- Éxito: `{ "data": <payload>, "meta"?: { ... } }`. Listas paginadas: `meta: { page, pageSize, total }`.
- Error: HTTP status + `{ "error": { "code": "STOCK_INSUFFICIENT", "details"?: {...} } }`. El FE traduce `code`.
- Auth: `Authorization: Bearer <token>`; invitado: `X-Guest-Session-Id: <uuid>`.
- Códigos de error: `VALIDATION_ERROR (422)`, `UNAUTHENTICATED (401)`, `FORBIDDEN (403)`, `NOT_FOUND (404)`, `INVALID_CREDENTIALS (401)`, `OTP_INVALID (401)`, `EMAIL_TAKEN (409)`, `STOCK_INSUFFICIENT (409)`, `INVALID_TRANSITION (409)`, `ALREADY_RATED (409)`, `COUPON_INVALID (422)`, `POINTS_INSUFFICIENT (422)`, `OUT_OF_RANGE (422)`, `SERVER_ERROR (500)`.

### 6.2 Endpoints

**Autenticación** — `auth.controller.js`

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | — | `{name,email,password,whatsappPhone,guestSessionId?,migrationProfileName?}` → `{user,token}`; migra invitado |
| POST | `/auth/login` | — | `{email,password,guestSessionId?}` → `{user,token}` |
| POST | `/auth/otp/request` | — | `{email}` → 204 (mock: código `123456`) |
| POST | `/auth/otp/verify` | — | `{email,code}` → `{user,token}` |
| POST | `/auth/password/forgot` · `/auth/password/reset` | — | Recuperación (mock: token fijo) |
| GET | `/auth/me` | user | Usuario actual |
| POST | `/auth/logout` | user | Invalida token |

**Cuenta** — `profiles.controller.js`, `addresses.controller.js`, `points.controller.js`

| Método | Path | Descripción |
|---|---|---|
| GET/POST | `/me/profiles` | Listar / crear perfil |
| PATCH/DELETE | `/me/profiles/:id` | Editar / baja |
| PUT | `/me/profiles/:id/default` | Marcar por defecto |
| GET/POST | `/me/addresses` · PATCH/DELETE `/me/addresses/:id` · PUT `/me/addresses/:id/default` | Agenda de direcciones |
| GET | `/me/points` | `{balance, movements[]}` |
| GET | `/me/coupons` | Cupones canjeados vigentes |
| GET | `/me/restock-alerts` · DELETE `/me/restock-alerts/:id` | Suscripciones de reposición |

**Talle** — `size-generations.controller.js`, `sizes.controller.js`

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/size-generations` | invitado/user | Crea y calcula la generación |
| GET | `/size-generations` | user | Historial (`?profileId=&page=`) |
| GET | `/size-generations/:id` | dueño | Detalle |
| PATCH | `/size-generations/:id/feedback` | dueño | `{rating, comment?}` → `{generation, reward}` |
| GET | `/sizes` | — | `?line=` |

**Catálogo y reposición** — `catalog.controller.js`, `alerts.controller.js`

| Método | Path | Descripción |
|---|---|---|
| GET | `/catalog` | `?line=&sizeId=` → productos con variantes con `available > 0` en ese talle; `meta.hasStock`, `meta.size`, `meta.adjacentSizes[]` |
| GET | `/catalog/:productId` | `?sizeId=` → detalle con colores y disponibilidad |
| POST | `/restock-alerts` | `{line,sizeId}` (user) → crea una alerta por variante (Q-06) |

**Compra y recompensas** — `sales.controller.js`, `rewards.controller.js`

| Método | Path | Descripción |
|---|---|---|
| POST | `/coupons/validate` | `{code, items}` → `{valid, discount}` |
| POST | `/sales` | Crea venta + reserva; devuelve `contact` |
| GET | `/me/sales` · `/me/sales/:id` | Mis compras |
| GET | `/rewards` | Plantillas de cupón canjeables (`pointsCost`) |
| POST | `/rewards/:couponId/redeem` | → cupón propio + balance |

**Administración** — `admin-*.controller.js` (rol `Admin`)

| Método | Path | Descripción |
|---|---|---|
| GET | `/admin/sales` | `?status=&channel=&from=&to=&page=` |
| GET | `/admin/sales/:id` | Detalle con cliente, líneas, logística, canal |
| PATCH | `/admin/sales/:id/status` | `{status}` (`Contacted`\|`Confirmed`\|`Cancelled`) |
| GET | `/admin/variants` | `?productId=&line=&sizeId=&color=&lowStock=` con `quantity/reserved/available` |
| POST/PATCH | `/admin/variants` · `/admin/variants/:id` | Alta / edición |
| GET/POST | `/admin/products` · PATCH/DELETE `/admin/products/:id` | CRUD (baja lógica) |
| POST | `/admin/stock-transactions` | `{reason, direction, lines[{variantId,quantity}]}` |
| GET | `/admin/stock-transactions` | Auditoría (`?variantId=&reason=&from=&to=`) |
| GET | `/admin/analytics/conversion` | `?from=&to=` → `{generations, sales, ratio}` |
| GET | `/admin/analytics/precision` | → `{purchased:{correct,total}, consultedOnly:{correct,total}}` |
| GET | `/admin/analytics/critical-stock` | Variantes bajo mínimo |
| GET | `/admin/analytics/missing-sizes` | `?from=&to=&line=` → celdas `{line,size,count}` |
| GET | `/admin/analytics/comments` | `?rating=&line=&from=&to=` |
| GET/PATCH | `/admin/settings` | Lectura / edición en bloque |
| GET/POST/PATCH | `/admin/coupons` · `/admin/coupons/:id` | Plantillas y cupones |

> **Exportación:** en el prototipo el FE genera CSV/Excel a partir de los datos ya cargados. En la API real lo ideal es `GET ...?format=csv|xlsx`; el hook `use-export` se cambia sin afectar pantallas.

### 6.3 Payloads clave

**`POST /size-generations`**
```json
// request
{ "line": "Endurance", "height": 165, "bust": 90, "waist": 72, "hip": 98, "torso": 140,
  "fitType": "Training", "source": "QR", "profileId": null,
  "onBehalf": false, "customerId": null }
// 201 response
{ "data": {
  "id": 812, "line": "Endurance", "createdAt": "2026-09-23T14:10:00Z",
  "suggestedSize": { "id": 12, "code": "M", "sortOrder": 3 },
  "dominantMeasure": "hip",
  "stockAvailableAtQuery": false,
  "adjacentSizes": [ { "id": 11, "code": "S" }, { "id": 13, "code": "L" } ],
  "rating": null } }
// fuera de rango: 422 { "error": { "code": "OUT_OF_RANGE", "details": { "measure": "bust", "direction": "above" } } }
```

**`POST /sales`**
```json
// request
{ "items": [ { "variantId": 301, "quantity": 1 } ],
  "channel": "Whatsapp", "deliveryMethod": "HomeDelivery", "addressId": 7,
  "generationId": 812, "couponCode": "VIKI10" }
// 201 response
{ "data": { "id": 55, "status": "PendingCoordination", "channel": "Whatsapp",
  "reservedUntil": null,
  "contact": { "channel": "Whatsapp", "to": "+598...", "subject": null,
    "body": "…mensaje armado…", "url": "https://wa.me/598...?text=…" } } }
// 409 { "error": { "code": "STOCK_INSUFFICIENT", "details": { "variantId": 301, "available": 0 } } }
```

**`PATCH /size-generations/:id/feedback`**
```json
{ "rating": "Correct", "comment": "Me quedó perfecto en la cadera" }
// → { "data": { "generation": {…}, "reward": { "awarded": true, "points": 10, "balance": 40, "dailyLimitReached": false } } }
```

---

## 7. Quickstart (`quickstart.md`)

### 7.1 Puesta en marcha

```bash
npm create vite@latest vkfit-fe -- --template react
cd vkfit-fe

# Runtime
npm i @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/modals \
      @mantine/dates @mantine/charts dayjs recharts \
      react-router @tanstack/react-query zod mantine-form-zod-resolver @tabler/icons-react \
      zustand lenis tailwindcss @tailwindcss/vite @fontsource/inter

# Dev
npm i -D @biomejs/biome vitest jsdom \
         @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```
> `react-router` (v7 unificó `react-router-dom`). No hace falta PostCSS de Mantine: los estilos entran por `src/index.css`. Verificar versiones contra `agents/llms-full.txt`.

**Alias de imports:** `vite.aliases.js` (lo comparten Vite y Vitest) + `jsconfig.json` para el editor.
**Lint y formato:** Biome (`biome.json`), un solo tool.

`.env.example`
```
VITE_API_MODE=mock                # mock | http
VITE_API_BASE_URL=/api/v1         # usado en modo http
VITE_MOCK_LATENCY_MS=250-600
VITE_MOCK_FAIL_RATE=0             # 0..1 para probar estados de error
```

Scripts: `dev`, `build`, `preview`, `lint` (`biome check`), `format`, `test`, `test:watch`, `i18n:check`.

### 7.2 Credenciales demo (solo modo mock)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@vikinga.test` | `admin123` |
| Cliente con datos | `ana@example.test` | `cliente123` |
| Cliente vacío | `nuevo@example.test` | `cliente123` |

OTP en mock: `123456`. Reset de datos: `/dev` → "Restablecer base mock".

### 7.3 Recorrido de verificación (aceptación manual)

1. **Invitado:** `/` → probar sin registrarse → `/fit?line=endurance` (línea preseleccionada) → cargar medidas → ver talle → ver CTA de registro.
2. **Sin stock:** medidas que den Endurance M → mensaje explícito → suscribirse a reposición → ver talles adyacentes rotulados.
3. **Registro con migración:** desde el resultado, registrarse → la generación aparece en `/account/history` y las medidas como perfil por defecto.
4. **Compra:** con talle con stock → catálogo → producto/color → `/checkout` → retiro o envío → canal WhatsApp → confirmar → se abre el enlace y aparece "Pendiente de coordinación".
5. **Conflicto:** con la variante de 1 unidad, reservar desde dos sesiones → la segunda ve `STOCK_INSUFFICIENT`.
6. **Admin:** login como admin → dashboard → venta pendiente → Contactada → Confirmada → el stock físico baja y el catálogo cliente lo refleja; otra venta → Cancelada → el stock vuelve a estar disponible.
7. **Feedback y puntos:** calificar con comentario → toast de puntos (o límite diario) → canjear cupón → aplicarlo en checkout.
8. **Analítica:** mapa de talles faltantes, comentarios y exportación CSV/Excel.
9. **Reglas:** en `/admin/settings` poner probabilidad 100 % y verificar que el siguiente feedback otorga puntos.
10. **Asistente:** `/admin/assistant` → generar para un tercero → no aparece en el historial del admin.
11. **Idioma y rutas:** cambiar es ↔ en en cada pantalla (sin literales sueltos); todas las URLs en inglés.
12. **Paso a API real:** `VITE_API_MODE=http` → el build no incluye `src/mocks/`.

---

## 8. Tareas (`tasks.md`)

**Notación:** `T###` id estable · `[P]` paralelizable (archivos distintos, sin dependencia) · `[USn]` historia · rutas exactas. Antes de **toda** tarea que toque Mantine: consultar la sección correspondiente de `agents/llms-full.txt`. Toda tarea de UI incluye sus claves en `es.js` y `en.js`.

> **Estado:** `[x]` hecha · `[~]` parcial o con desvío (se aclara al lado) · `[ ]` pendiente · `➖` descartada. Última actualización: **iteración 7 (M2 cerrado)**. El detalle de cada iteración está en `agents/iteraciones.md` y el estado consolidado en `agents/scan-vkfit-estado-y-pendientes.md`.

### Fase 1 — Setup

- [x] T001 Crear proyecto Vite + React (JS) y copiar `CLAUDE.md` y `agents/llms-full.txt` — raíz
- ➖ T002 Ejecutar `specify init`, cargar constitución (§1) — `.specify/memory/constitution.md` · *descartada: el usuario aporta su propio spec*
- [~] T003 [P] Instalar dependencias de §7.1 y configurar PostCSS de Mantine — `package.json`, `postcss.config.cjs` · *§7.1 completo declarado en `package.json` (Mantine entero, `dayjs`, `recharts`, `mantine-form-zod-resolver`); **la instalación la corre el usuario** (el lock queda desactualizado hasta entonces). Sin PostCSS: `src/index.css` importa los estilos*
- [x] T004 [P] Configurar alias `@`→`src`, env tipadas y `.env.example` — `vite.config.js`, `src/config/env.js`, `.env.example` · *alias por carpeta (`vite.aliases.js`: `@components`, `@api`, `@features`, …) compartidos con Vitest + `jsconfig.json`; env tipadas y `.env.example`*
- [~] T005 [P] ESLint + Prettier: `no-literal-string`, kebab-case (`check-file`), `no-restricted-imports` de `src/mocks/**` fuera de `src/api/` y `src/mocks/` — `eslint.config.js` · *reemplazados por **Biome** (`biome.json`: lint + format + `noRestrictedImports` para `**/mocks/**` y `@mocks/**`). Pendiente: no hay regla de `no-literal-string` ni de kebab-case en Biome (quedan por revisión)*
- [x] T006 [P] Vitest + jsdom + setup — `vitest.config.js`, `src/test/setup.js` · *+ Testing Library (`react`/`dom`/`user-event`/`jest-dom`) en la iteración 6*
- [~] T007 Crear árbol de carpetas de §4.4 (archivos `.gitkeep`) — `src/**` · *existe el árbol de todo lo implementado; falta lo que corresponde a historias pendientes: `profile-selector`, `features/feedback/`, `features/admin/{dashboard,inventory,catalog-admin,analytics,settings,coupons,assistant}`, `hooks/`, `utils/{format,download,query-keys}.js`, `config/features.js`. Desvíos de §4.4: `.specify/` y `specs/` descartados con T002; `i18n/context.js` en lugar de `use-i18n.js`; `/dev` en `pages/dev/dev-page.jsx`*

### Fase 2 — Fundacional (bloquea todas las historias)

**Tema, i18n y app shell** _(iteración 2)_
- [x] T008 [P] Tema Mantine con paleta placeholder `vikinga`, breakpoints, defaults móviles — `src/theme/theme.js`
- [x] T009 [P] `i18n-provider` + `use-i18n` (`t`, interpolación, plurales, `formatNumber/Date/Currency`, persistencia de idioma) — `src/i18n/`
- [x] T010 [P] Locales base (`common`, `nav`, `errors`, `validation`, `enums`) es/en — `src/i18n/locales/es.js`, `en.js`
- [x] T011 Script de paridad de claves y npm script `i18n:check` — `scripts/check-i18n.mjs`
- [x] T012 [P] Constantes de enums y líneas (slug ↔ valor) — `src/constants/enums.js`, `lines.js`
- [x] T013 Módulo de rutas en inglés con helpers (`routes.fit()`, `routes.adminSale(id)`) — `src/app/routes.js`
- [~] T014 Providers (Mantine, Notifications, Modals, Query, i18n, Auth, ActiveProfile) — `src/app/providers.jsx` · *Mantine, i18n, Query, Auth y ActiveProfile ✅; sin `Notifications`/`Modals` (no instalados: la confirmación usa `Modal` de core)*
- [x] T015 Router con rutas `lazy` para todas las pantallas (páginas stub con título i18n) — `src/app/router.jsx`
- [x] T016 [P] Layouts público / cliente (header + barra inferior móvil) / admin (navbar colapsable) — `src/components/layout/`
- [x] T017 [P] Componentes de estado: `query-boundary`, `empty-state`, `error-state`, `skeletons` — `src/components/feedback/`
- [x] T018 [P] Componentes comunes: `page-header`, `language-switch`, `money`, `date-time`, `responsive-list`, badges de talle/stock/estado/canal — `src/components/`

**Capa API y mock** _(iteración 1)_
- [x] T019 `ApiError` y contrato de respuesta/errores (§6.1) — `src/api/client/api-error.js`
- [x] T020 `http-transport` (fetch, headers de auth/guest, mapeo de errores) — `src/api/client/http-transport.js`
- [x] T021 `api-client` con selección de transporte por `VITE_API_MODE` e import dinámico del mock — `src/api/client/api-client.js`
- [x] T022 `mock-router` (registro `register(method, pattern, handler, {auth})`, matching de `:params`, auth por rol, latencia y fallos) — `src/mocks/router/mock-router.js`
- [x] T023 `mock-transport` que adapta `mock-router` a la interfaz del transporte — `src/mocks/mock-transport.js`
- [x] T024 [P] Base de datos mock en memoria + persistencia `localStorage` versionada + reset — `src/mocks/db/database.js`, `persistence.js`
- [x] T025 [P] Seed: usuarios, talles, productos, variantes, settings — `src/mocks/db/seed/`
- [x] T026 [P] Seed histórico: generaciones, ventas, movimientos, cupones (fechas relativas a hoy, casos de §4.8) — `src/mocks/db/seed/`
- [x] T027 [P] Dominio `stock.js` (reservado/disponible/crítico) + tests — `src/mocks/domain/stock.js`
- [x] T028 [P] Dominio `sale-state-machine.js` + tests — `src/mocks/domain/`
- [x] T029 Tests del `mock-router` (matching, 401/403/404, latencia) — `src/mocks/router/mock-router.test.js`
- [x] T030 Auth mock: controller (`register/login/otp/forgot/me/logout`) y `auth-service` — `src/mocks/controllers/auth.controller.js`, `src/api/services/auth-service.js`
- [x] T031 `auth-context` (sesión, `guestSessionId`, rol, `returnTo`) y guards `require-auth`, `require-role`, `guest-only` — `src/features/auth/`, `src/app/guards/`
- [x] T032 `active-profile-context` (perfil activo persistido) — `src/features/account/`
- [x] T033 Tests de rutas (todas en inglés/únicas) y de paridad i18n — `src/app/routes.test.js`
- [~] T034 [P] Herramientas `/dev` (reset DB, cambiar usuario, latencia) solo en modo mock — `src/mocks/dev/dev-tools.jsx` · *reset y login-as funcionan en `src/pages/dev/dev-page.jsx`; la latencia y la tasa de fallos se configuran por env (`VITE_MOCK_LATENCY_MS`, `VITE_MOCK_FAIL_RATE`), sin UI*

**Checkpoint F2:** ✅ app navega entre páginas, cambia idioma, hace login mock, guards funcionando.

### Fase 3 — US1: Talle como invitado (P1) 🎯 MVP _(iteración 3)_

- [x] T035 [P] [US1] Dominio `size-engine.js` (R-14, `OUT_OF_RANGE`, dominante, adyacentes) + tests exhaustivos — `src/mocks/domain/size-engine.js` · *placeholder: el motor real se integra al final (§7)*
- [x] T036 [US1] Controllers `size-generations` (POST/GET/GET:id) y `sizes` — `src/mocks/controllers/size-generations.controller.js`, `sizes.controller.js`
- [x] T037 [P] [US1] `size-service` + hooks (`use-create-generation`, `use-generation`) — `src/api/services/size-service.js`, `src/features/fit/hooks/`
- [x] T038 [US1] `home-page` con los tres caminos + `about-page` — `src/features/home/` · *`/about` reutiliza la landing (`src/pages/landing-page/`)*
- [x] T039 [US1] `fit-form` (línea, 5 medidas, validación zod, precarga por `?line`/`linea`, cálculo de `source`, `guestSessionId`) — `src/features/fit/fit-form.jsx`
- [x] T040 [P] [US1] `measure-help` (Drawer con instrucciones por medida) — `src/features/fit/measure-help.jsx`
- [x] T041 [US1] `fit-page` y `result-page` (talle, dominante, stock, CTA de registro con beneficios, CTA a catálogo) — `src/features/fit/`
- [x] T042 [P] [US1] Estado `out-of-range` — `src/features/fit/out-of-range.jsx`
- [x] T043 [US1] Claves i18n `home.*`, `fit.*` es/en — `src/i18n/locales/`

**Checkpoint US1:** ✅ `/` → talle sin registrarse, incluido QR con línea preseleccionada.

### Fase 4 — US2: Cuenta y migración (P1) _(iteración 4)_

- [x] T044 [US2] Migración de invitado en `register`/`login` del controller (generaciones → cliente + perfil por defecto) + tests — `src/mocks/controllers/auth.controller.js`
- [x] T045 [P] [US2] `register-page` con link "¿Ya tienes una cuenta? Iniciar sesión" y `returnTo` — `src/features/auth/register-page.jsx`
- [x] T046 [P] [US2] `login-page` unificado (redirección por rol, credenciales demo en modo mock) — `src/features/auth/login-page.jsx`
- [x] T047 [P] [US2] `otp-page`, `forgot-password-page`, `reset-password-page` — `src/features/auth/`
- [x] T048 [US2] Menú de cuenta y logout en layouts — `src/components/layout/`
- [x] T049 [US2] Claves i18n `auth.*` — `src/i18n/locales/`

### Fase 5 — US3: Catálogo filtrado y sin stock (P1) _(iteración 5)_

- [x] T050 [US3] Controller `catalog` (filtrado por talle, `available>0`, `meta.adjacentSizes`) + tests — `src/mocks/controllers/catalog.controller.js`
- [x] T051 [P] [US3] Controller `alerts` (`POST /restock-alerts`, lista, baja) y aviso al reponer — `src/mocks/controllers/alerts.controller.js` · *el aviso al reponer (`notifyRestockAlerts`) queda a la espera de que US9 registre ingresos*
- [x] T052 [P] [US3] `catalog-service`, `alerts-service` + hooks con query keys — `src/api/services/`, `src/features/catalog/hooks/`
- [x] T053 [US3] `catalog-page`, `product-card`, `product-detail` (color/talle, colores agotados deshabilitados) — `src/features/catalog/`
- [x] T054 [US3] `no-stock-state`, `adjacent-sizes` (con leyenda "no es tu talle recomendado"), `restock-subscribe` (requiere login) — `src/features/catalog/` · *los adyacentes se muestran dentro de `no-stock-state`/`result-page`, sin componente aparte*
- [x] T055 [P] [US3] `alerts-page` (mis avisos) — `src/features/account/alerts-page.jsx`
- [x] T056 [US3] Claves i18n `catalog.*` — `src/i18n/locales/`

### Fase 6 — US4: Coordinar compra (P1) _(iteración 6)_

- [x] T057 [P] [US4] Dominio `coordination-message.js` (asunto/cuerpo/URL `mailto:`/`wa.me` desde settings) + tests — `src/mocks/domain/` · *+ `coupons.js`, `sales.js` y `money.js`*
- [x] T058 [US4] Controllers `sales` (`POST /sales` atómico con reserva, `GET /me/sales`) y `coupons/validate` + tests de conflicto — `src/mocks/controllers/sales.controller.js` · *`coupons/validate` quedó en `coupons.controller.js`; se agregó `GET /me/sales/:id` para la confirmación*
- [~] T059 [P] [US4] Controllers `profiles`/`addresses` mínimos para checkout (alta de dirección) — `src/mocks/controllers/addresses.controller.js` · *solo `addresses` (listar + alta); el CRUD de `profiles` y de direcciones llega en US5/T071–T075*
- [x] T060 [P] [US4] `sales-service`, `addresses-service` + hooks; invalidar `['catalog']` al crear venta — `src/api/services/`, `src/features/checkout/hooks/`
- [x] T061 [US4] Carrito/selección de línea (estado local de checkout) y redirección de invitado a registro con `returnTo` — `src/features/checkout/` · *una línea por venta (el carrito multi-línea queda fuera por decisión); la selección viaja por query desde el catálogo y el guard de `RequireAuth` conserva el `returnTo`*
- [x] T062 [US4] `checkout-page` con `delivery-step`, `channel-step` (Email por defecto), `coupon-input`, `summary-step` — `src/features/checkout/`
- [x] T063 [US4] `confirmation-page` (abre `contact.url`, botón de respaldo si el navegador bloquea, estado de la venta) — `src/features/checkout/confirmation-page.jsx`
- [x] T064 [US4] Manejo de `STOCK_INSUFFICIENT` sin perder la selección — `src/features/checkout/`
- [x] T065 [US4] Claves i18n `checkout.*` — `src/i18n/locales/`

### Fase 7 — US7: Admin gestiona ventas (P1) _(iteración 7)_

- [x] T066 [US7] Controller `admin-sales` (listado, detalle, `PATCH status` con transición y movimiento `SaleConfirmed`) + tests de estados y stock — `src/mocks/controllers/admin-sales.controller.js`
- [x] T067 [P] [US7] `admin-sales-service` + hooks (invalidan `['catalog']`, `['admin','inventory']`) — `src/api/services/`, `src/features/admin/sales/hooks/`
- [x] T068 [US7] `sales-page` con `Tabs` por estado, filtro de canal, `responsive-list`, antigüedad resaltada — `src/features/admin/sales/` · *el umbral de antigüedad es `SETTING.stale_sale_days` (Q-11)*
- [x] T069 [US7] `sale-detail` (Drawer/página) con cliente, teléfono, logística, canal y acciones con confirmación — `src/features/admin/sales/` · *página + `Modal` de core (no se instaló `@mantine/modals`)*
- [x] T070 [US7] Claves i18n `admin.sales.*` — `src/i18n/locales/`

**Checkpoint P1:** ✅ recorrido completo cliente + admin funcionando (hito de demo con el cliente) — **M2 cerrado**.

### Fase 8 — US5: Perfiles y direcciones (P2) _(iteración 9)_ ✅

- [x] T071 [US5] Controller `profiles` completo (CRUD, default, baja lógica) + tests — `src/mocks/controllers/profiles.controller.js`
- [x] T072 [P] [US5] `profiles-service` + hooks — `src/api/services/profiles-service.js`
- [x] T073 [US5] `profile-selector` global y precarga de `fit-form` — `src/components/profile-selector.jsx`, `src/features/fit/`
- [x] T074 [P] [US5] `profiles-page` y `save-profile-modal` (desde resultado) — `src/features/account/`, `src/features/fit/`
- [x] T075 [P] [US5] `addresses-page` (alta/edición/baja/default) — `src/features/account/addresses-page.jsx`
- [x] T076 [US5] Claves i18n `account.*` — `src/i18n/locales/`

### Fase 9 — US6: Feedback, puntos, cupones, historial (P2) _(iteración 10)_ ✅

- [x] T077 [P] [US6] Dominio `points.js` (probabilidad, tope diario, RNG inyectable) + tests — `src/mocks/domain/points.js`
- [x] T078 [US6] Controllers `feedback`, `points`, `rewards` (canje), `me/coupons` — `src/mocks/controllers/`
- [x] T079 [P] [US6] `rewards-service` + hooks — `src/api/services/rewards-service.js`
- [x] T080 [US6] `feedback-drawer` (chico/correcto/grande + comentario), `points-toast`, integración en resultado e historial — `src/features/feedback/`
- [x] T081 [P] [US6] `history-page` (por perfil, pendientes de calificar) y `orders-page` — `src/features/account/`
- [x] T082 [P] [US6] `rewards-page` (saldo, movimientos, canje, mis cupones) y aplicación en checkout — `src/features/account/rewards-page.jsx`
- [x] T083 [US6] Claves i18n `rewards.*`, `feedback.*` — `src/i18n/locales/`

### Fase 10 — US8: Dashboard (P2) _(iteración 11)_ ✅

- [x] T084 [US8] Controllers `admin-analytics` (conversion, precision, critical-stock) + tests — `src/mocks/controllers/admin-analytics.controller.js`
- [x] T085 [P] [US8] `admin-analytics-service` + hooks con filtro de fechas — `src/api/services/`
- [x] T086 [US8] `dashboard-page` (4 bloques, `DatePickerInput`, `RingProgress`/gráficos lazy, ventas en vuelo con canal y teléfono) — `src/features/admin/dashboard/` · *sin `@mantine/dates` instalado: el rango se elige con presets (`SegmentedControl` 7/30/90/todo) que calculan `from`/`to`; los KPIs usan `RingProgress`/`Progress` de core (sin `@mantine/charts`)*
- [x] T087 [US8] Claves i18n `admin.dashboard.*` — `src/i18n/locales/`

### Fase 11 — US9: Inventario y catálogo (P2) _(iteración 12)_ ✅

- [x] T088 [US9] Controllers `admin-variants`, `admin-products`, `admin-stock-transactions` (motivo obligatorio, reposición dispara alertas) + tests — `src/mocks/controllers/`
- [x] T089 [P] [US9] `admin-inventory-service`, `admin-catalog-service` + hooks — `src/api/services/`
- [x] T090 [US9] `inventory-page` (filtros, disponible/reservado/físico, alerta crítica) y modal de ajuste con motivo — `src/features/admin/inventory/`
- [x] T091 [P] [US9] `movements-page` (auditoría) — `src/features/admin/inventory/movements-page.jsx`
- [x] T092 [P] [US9] `products-page` (CRUD producto/variantes, baja lógica) — `src/features/admin/catalog-admin/`
- [x] T093 [US9] Claves i18n `admin.inventory.*`, `admin.products.*` — `src/i18n/locales/`

### Fase 12 — US10, US11, US12 (P3)

- [ ] T094 [US10] Controllers `missing-sizes` y `comments` — `src/mocks/controllers/admin-analytics.controller.js`
- [ ] T095 [P] [US10] `missing-sizes-page` (mapa de calor con `Table` coloreada) y `comments-page` (filtros) — `src/features/admin/analytics/`
- [ ] T096 [P] [US10] `use-export` + `download.js` (CSV propio, Excel por `import()`), botones en cada reporte — `src/hooks/use-export.js`, `src/utils/download.js`
- [ ] T097 [P] [US11] Controllers `admin-settings`, `admin-coupons` — `src/mocks/controllers/`
- [ ] T098 [US11] `settings-page` (probabilidad, puntos, tope diario, contacto) y `coupons-page` (costo de canje, vigencia) — `src/features/admin/settings/`, `.../coupons/`
- [ ] T099 [US12] Soporte `onBehalf`/`customerId` en `size-generations` y exclusión de historial/métricas personales — `src/mocks/controllers/size-generations.controller.js`
- [ ] T100 [US12] `assistant-page` reutilizando `fit-form` con switch "Para terceros" y vínculo opcional a cliente — `src/features/admin/assistant/`
- [ ] T101 [P] Claves i18n `admin.analytics.*`, `admin.settings.*`, `admin.assistant.*` — `src/i18n/locales/`

### Fase 13 — Pulido y validación

- [ ] T102 [P] Revisión responsive a 360/768/1280 px de todas las pantallas; objetivos táctiles y foco
- [ ] T103 [P] Accesibilidad: labels, `aria-*` traducidos, contraste, navegación por teclado en modales/drawers
- [ ] T104 [P] Rendimiento: analizar bundle, verificar chunks lazy (admin, charts, export), Lighthouse mobile en `/` y `/fit`
- [~] T105 Verificar que `VITE_API_MODE=http` excluye `src/mocks/` del bundle (SC-005) · *verificado en cada iteración (build mock + http y barrido de marcadores en `dist/`); conviene repetirlo en el cierre*
- [~] T106 Barrido i18n: 0 literales (lint), `i18n:check` verde, revisión de textos es/en · *`i18n:check` verde (487 claves con paridad); **falta** la regla `no-literal-string` (T005)*
- [ ] T107 Estados de error: probar con `VITE_MOCK_FAIL_RATE` en cada pantalla con datos
- [~] T108 Ejecutar el recorrido de §7.3 completo y corregir · *US1–US4 y US7 cubiertos por tests de componentes; falta el barrido manual en navegador del recorrido completo*
- [ ] T109 [P] README con arquitectura de la capa API, cómo escribir un controller y cómo pasar a la API real
- [ ] T110 [P] (Opcional) Smoke E2E con Playwright: US1→US4→US7

### Dependencias y orden de ejecución

```
F1 Setup → F2 Fundacional ──┬─► US1 ─► US2 ─► US3 ─► US4 ─► US7   (camino crítico P1)
                            │                                  │
                            │                                  ├─► US8 (dashboard)
                            │                                  └─► US9 (inventario) ─► US10
                            ├─► US5 (perfiles/direcciones)  [necesita US2]
                            ├─► US6 (feedback/puntos)       [necesita US1, US2; aplica cupones en US4]
                            └─► US11, US12                  [US12 necesita US1]
```

- Dentro de cada historia: dominio/controller → service/hooks → UI → claves i18n → tests.
- Las tareas `[P]` de una misma fase pueden repartirse entre personas/agentes sin conflicto de archivos.

### Hitos de demo

| Hito | Contenido | Tareas | Estado |
|---|---|---|---|
| **M0** | Esqueleto navegable, idioma, login mock | F1–F2 | ✅ *(T007 parcial: faltan carpetas de historias pendientes)* |
| **M1** | Invitado obtiene talle (QR incluido) y se registra | US1, US2 | ✅ |
| **M2** | Catálogo filtrado, sin stock, compra coordinada + admin gestiona venta | US3, US4, US7 | ✅ **cerrado (iteración 7)** |
| **M3** | Perfiles, direcciones, feedback, puntos, cupones | US5, US6 | ✅ **cerrado (iteración 10)** |
| **M4** | Dashboard, inventario, catálogo admin | US8, US9 | ✅ **cerrado (iteración 12)** |
| **M5** | Analítica, exportación, reglas, modo asistente, pulido | US10–US12, F13 | 🟡 **siguiente** |

---

## 9. Preguntas abiertas y supuestos (`/speckit.clarify`)

Los supuestos se implementan en el mock tal como se indica, aislados para poder cambiarlos sin tocar la UI.

| ID | Tema | Ambigüedad detectada en los documentos | Supuesto del prototipo | Impacto |
|---|---|---|---|---|
| **Q-01** | Matriz y regla de talle | No se define la matriz de rangos por línea ni cómo resolver rangos solapados o huecos entre las 5 medidas. | R-14: la medida más exigente dicta el talle; seed placeholder. | **Alto** |
| **Q-02** | `fit_type` (Training/Competition) | Está en el ERD pero no en ninguno de los recorridos. | Selector detrás de flag `features.fitType`; Competition = un talle menos, con tope al mínimo. | Medio |
| **Q-03** | Reserva y `id_transacción` | El texto dice que al coordinar se "genera un id_transacción y un id_venta", pero en el ERD `TRANSACTION` es un movimiento de stock (`SaleConfirmed`). El ERD no tiene tabla de reservas. | Reserva **derivada** de ventas abiertas; la transacción de stock se crea solo al confirmar. | **Alto** |
| **Q-04** | Transiciones de venta | Confirmar ¿solo desde Contactado o también desde Pendiente? | Solo desde Contactado (tabla editable). | Medio |
| **Q-05** | Migración al iniciar sesión | El texto solo la menciona al registrarse. | También migra al hacer login si hay `guestSessionId`. | Bajo |
| **Q-06** | Aviso de reposición | `ALERT` es por variante, pero el aviso se pide por "talle sin stock en ningún color de la línea". `notification_mode` no está definido. | `POST /restock-alerts {line,sizeId}` crea una alerta por variante; notificación in-app. | Medio |
| **Q-07** | Cupones en compra | El ERD relaciona `SALE.id_coupon`, pero los recorridos no describen dónde se aplica; tampoco cómo funcionan `max_discount`/`usage_count`. | Campo de cupón opcional en checkout; plantilla → copia propia al canjear; `usageCount` +1 al crear y −1 al cancelar. | Medio |
| **Q-08** | Datos demográficos | "Datos demográficos" del registro no se especifican. | Nombre, email, contraseña, WhatsApp. | Bajo |
| **Q-09** | Destino y composición del mensaje | No se indica el email/número de Vikinga ni quién arma el mensaje. | Claves `coordination_email` / `coordination_whatsapp` en `SETTING`; el controller compone. | Medio |
| **Q-10** | Nombres de ruta y query | Doc técnica: `/fit?linea=`; regla de FE: rutas en inglés (ejemplo `/generator`). | `/fit?line=` con alias `linea=`; renombrable en `routes.js`. | Bajo |
| **Q-11** | Vencimiento de reservas | Sin TTL definido: una venta abandonada retiene stock indefinidamente. | **Resuelto (iteración 7): sin TTL.** `SETTING.stale_sale_days` (3 por defecto) marca las ventas abiertas y el admin decide si las mueve o las cancela; el dashboard de US8 podrá alertar. | Cerrada |
| **Q-12** | Mapa de faltantes por color | La doc habla de "talle o color", pero `SIZE_GENERATION` no guarda color. | Agregado por línea × talle. | Medio |
| **Q-13** | Formato JSON | ERD en `snake_case`; JS idiomático en `camelCase`. | camelCase; si la API usa snake_case, se convierte en `api-client` en un solo punto. | Bajo |
| **Q-14** | Cambio por talle | `TRANSACTION` tiene una sola `direction`; un cambio implica entrada y salida. | El formulario admite 2 líneas y el controller crea dos transacciones enlazadas. | Bajo |
| **Q-15** | Feedback de invitado | Los recorridos permiten calificar sin compra, pero `PointsMovement` exige usuario. | Invitado puede calificar sin puntos, con CTA de registro; sin retroactividad de puntos. | Medio |
| **Q-16** | Marca y assets | No hay paleta, logo ni imágenes de producto. | Paleta placeholder y placeholders gráficos. | Bajo |

### Riesgos

| Riesgo | Mitigación |
|---|---|
| Que la lógica del mock se convierta en "verdad" del negocio y se copie al FE | Principio VII + lint de imports + carpeta `mocks/` descartable |
| Divergencia entre el contrato REST asumido y la API real | Publicar §6 al equipo de backend temprano; `mappers` localizados en services |
| Desborde de alcance por gamificación/analítica | P3 al final; hitos M0–M2 ya cubren el valor central |
| Rendimiento móvil degradado por admin/gráficos | Code-splitting por rutas y `import()` de charts/exportación |
| Textos sin traducir por olvido | Lint `no-literal-string` + `i18n:check` como gates |

---

## 10. Próximos pasos

1. Validar §9 con el cliente/backend (prioridad Q-01, Q-03, Q-04, Q-06; Q-11 quedó cerrada en la iteración 7).
2. Revisar el estado de las tareas en §8 (leyenda `[x]`/`[~]`/`[ ]`/`➖`) y el detalle por iteración en `agents/iteraciones.md`.
3. Retomar por **M5** (US10–US12 + F13): M3 y M4 quedaron cerrados (US5–US6 en las iteraciones 9–10, US8–US9 en la 11–12). El recorrido cliente (US1→US6) + panel (US7–US9) ya es demostrable.
4. Al final, integrar el motor de recomendación real (§7).

> El flujo de spec-kit de §0 queda como referencia; `specify init` (T002) se descartó porque el spec lo aporta el equipo.
