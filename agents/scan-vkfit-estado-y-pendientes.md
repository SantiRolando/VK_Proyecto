# Scan VKFit — Estado actual y pendientes (gap analysis)

> **Fecha:** 24-sep-2026 · **Propósito:** consolidar el resultado de los pasos 1–5 de la
> limpieza del prototipo FE y dejar definido qué falta para arrancar a iterar.
> **Fuente de la verdad:** `agents/scan-vkfit-fe-prototype-plan.md` (el plan).
> **Fuentes de apoyo:** `agents/context/scan-vkfit-er-explicacion.md` (modelo ER nuevo),
> `agents/context/recommendation-engine.txt` (motor de recomendación, se implementa **al final**),
> `agents/context/user-journey-non-technical.txt` (recorrido para despejar dudas puntuales).

---

## 1. Resumen ejecutivo

El frontend `app/frontend` contenía un prototipo anterior construido sobre un **ER inicial**
(modelo de datos plano: usuarios/stock/transacciones/cupones/reportes) y una **lógica de talle
temporal** (`recommend-size.js` + tablas hardcodeadas). Ese material se eliminó porque los cambios
de alcance (nuevo ER de 15 entidades y nueva regla de recomendación) lo dejaron obsoleto.

Se conservó la infraestructura reutilizable (setup Vite/Mantine/Tailwind, i18n provider, la landing,
componentes genéricos y los assets de medidas). El resultado **compila y pasa lint**.

Queda por construir prácticamente toda la capa de datos (`services → apiClient → transport` con mock
intercambiable por REST), los controllers/dominio/seed del mock, y las historias US1–US12 del plan.

---

## 2. Estado actual (dónde estamos)

```
app/
├── backend/               # vacío (sin backend en alcance)
└── frontend/
    ├── vite.config.js     # React + Tailwind (sin alias `@`, sin .env tipadas)
    ├── eslint.config.js   # base (sin reglas i18n/kebab-case/no-restricted-imports)
    ├── index.html
    ├── package.json       # deps instaladas (ver §5)
    └── src/
        ├── main.jsx       # MantineProvider + I18nProvider + QueryClient + Router + Lenis
        ├── app.jsx        # router mínimo: solo `/` → LandingPage
        ├── constants.js   # APP_NAME
        ├── theme.js       # tema Mantine placeholder
        ├── index.css      # Tailwind + Mantine (layer)
        ├── assets/        # imágenes de medidas + hero (reutilizables)
        ├── components/    # language-switch, actions-menu, responsive-table, route-fallback
        ├── i18n/          # context, i18n-provider, locales/{es,en}.js (solo claves landing)
        └── pages/
            └── landing-page/   # landing informativa (se adaptará a `/` y `/about`)
```

### Rutas activas hoy

| Ruta | Pantalla |
|---|---|
| `/` | `LandingPage` (landing informativa) |

Todo lo demás (fit, catálogo, checkout, cuenta, admin) está por implementarse.

---

## 3. Hacia dónde vamos (dónde tenemos que ir)

Resumen de la arquitectura objetivo (plan §4.3), ya alineada al **nuevo ER** de 15 entidades
(`USER`, `MEASUREMENT_PROFILE`, `ADDRESS`, `SIZE`, `PRODUCT`, `PRODUCT_VARIANT`,
`SIZE_GENERATION`, `SALE`, `SALE_LINE`, `DISCOUNT_COUPON`, `TRANSACTION`, `TRANSACTION_LINE`,
`ALERT`, `POINTS_MOVEMENT`, `SETTING`):

```
Componente → hook (TanStack Query) → service → apiClient → transport (mock | http)
                                              mock: mock-router → *.controller → domain/* → db (localStorage)
```

Puntos no negociables (constitución del plan §1):

- **Mantine primero** (consultar `agents/llms-full.txt`).
- **kebab-case** para archivos, **PascalCase** para componentes.
- **i18n total** con `useI18n()` (sin literales), paridad es/en.
- **Rutas en inglés** centralizadas en `src/app/routes.js`.
- **FE agnóstico de la fuente de datos**: los componentes **nunca** importan `src/mocks/`.
- **Sin lógica de negocio en el FE**: talle, puntos, reserva y transiciones viven en `src/mocks/`.
- **Mock descartable**: pasar a la API real = cambiar `VITE_API_MODE` (y ajustar mapeos localizados).

---

## 4. Qué borramos (y por qué)

| Ruta eliminada | Qué era | Motivo |
|---|---|---|
| `src/mocks/` (6 archivos) | Datos planos del ER inicial (sizing, users, stock, coupons, transactions, reports) | Modelo de datos obsoleto; el nuevo ER exige controllers + dominio + db + seed |
| `src/features/sizing/` | `recommend-size.js` + `sizing-schema.js` | **Lógica de talle temporal** (tablas hardcodeadas); reemplazada por la nueva regla y por `SIZE` |
| `src/features/stock|transactions|coupons|users/` | Schemas/opciones del ER inicial | Obsoletos ante el nuevo ER |
| `src/pages/generator|reports|stock|transactions|users|coupons/` | Pantallas admin CRUD del prototipo anterior | No mapean a las historias del plan ni al nuevo ER |
| `src/components/app-layout.jsx` | Shell admin con nav del ER inicial | Reemplazado por layouts público/cliente/admin (§4.4 del plan) |

---

## 5. Qué conservamos y cómo lo adaptamos

| Activo | Estado actual | Adaptación necesaria |
|---|---|---|
| `vite.config.js` | React + Tailwind, sin alias | Agregar alias `@`→`src`, env tipadas, `.env.example` (T004) |
| `eslint.config.js` | Base de Vite | Agregar `no-literal-string`, kebab-case, `no-restricted-imports` de `src/mocks/**` (T005) |
| `package.json` | Mantine core/hooks/charts, react-query, react-router, zod, zustand, lenis, tailwind, tabler | Agregar `@mantine/form`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dates`, `dayjs`, `mantine-form-zod-resolver`; dev: `vitest`, `jsdom`, Testing Library, plugins eslint i18n/check-file (T003, T006) |
| `src/main.jsx` | Providers cableados inline | Mover a `src/app/providers.jsx` (T014) |
| `src/app.jsx` | Router mínimo (`/`) | Migrar a `src/app/router.jsx` + `routes.js` + guards (T013, T015, T031) |
| `src/theme.js` | Paleta placeholder "dark" | Paleta vikinga de 10 tonos + defaults móviles (T008) |
| `src/i18n/` (provider + context) | `useI18n()` con `t` simple, sin persistencia ni formatos | Interpolación `{{var}}`, plurales, `formatNumber/Date/Currency`, persistencia de idioma (T009); estructura de claves nueva (T010) |
| `src/i18n/locales/{es,en}.js` | Solo claves de la landing | Reconstruir `common/nav/errors/validation/enums` + por área (T010) |
| `src/pages/landing-page/` | Landing informativa completa | Mover a `src/features/home/`; separar `/` (3 caminos) de `/about`; CTA "probar" → `/fit`, "login" → `/login` (T038) |
| `src/components/language-switch.jsx` | OK, reutilizable | Mantener |
| `src/components/actions-menu.jsx` | OK, genérico | Mantener (admin lo reutiliza) |
| `src/components/responsive-table.jsx` | OK, genérico (Table↔Card) | Mantener; el plan lo llama `responsive-list` |
| `src/components/route-fallback.jsx` | Loader de Suspense | Mantener |
| `src/assets/` | Imágenes de medidas + hero | Reutilizar en `fit-form` / measure-help; **ojo:** `indoor-swimming-pool.png` pesa ~2.6 MB (optimizar o usar placeholder) |

### Notas de contenido pendientes (deuda menor, al iterar)

- `how.step1.body` dice "Edad, sexo y nacionalidad…": texto heredado que **no** refleja el flujo de
  5 medidas. Corregir en la reconstrucción de la landing.
- El botón "Iniciar sesión" del CTA no tiene `onClick`. Debe apuntar a `/login`.

---

## 6. Qué queda pendiente (gap)

Mapeo contra las fases del plan (§8). Se marca lo ya resuelto y lo que falta.

### Fase 1 — Setup

| Estado | Tareas |
|---|---|
| ✅ Hecho | T001 (Vite+React+CLAUDE.md+llms-full.txt), T003 (deps core), T004 (env + `.env.example`, sin alias `@`), T005 (eslint + `no-restricted-imports`), T006 (Vitest + jsdom + setup) |
| ❌ Pendiente | T002 (specify init/constitution), T007 (árbol §4.4 completo), alias `@` (se decidió mantener imports relativos por consistencia) |

### Fase 2 — Fundacional (bloquea todo)

| Estado | Tareas |
|---|---|
| ✅ Hecho | **Iteración 1 (capa de datos):** T013 (routes.js), T014 (providers), T019–T034 (ApiError, transports, api-client, mock-router, mock-transport, database + persistencia, seed del ER nuevo, dominio stock y sale-state-machine, auth controller/service + migración de invitado, auth-context + guards, active-profile-context, tests, `/dev`) · **Iteración 2 (base UI):** T008 (tema con paleta placeholder vikinga), T009 (i18n con interpolación, plurales, formatos y persistencia), T010 (locales base: common/nav/validation/enums/títulos + dev + errors), T011 (script `i18n:check` + test de paridad), T012 (enums y lines con slug↔valor), T015 (router con todas las rutas lazy + páginas stub + 404), T016 (layouts público/cliente/admin con barra inferior móvil), T017 (query-boundary, empty-state, error-state, skeletons), T018 (page-header, money, date-time, badges de talle/stock/estado/canal, responsive-list) |
| ❌ Pendiente (Fase 2) | T002 (specify init/constitution), T007 (árbol §4.4 completo), alias `@` (se mantienen imports relativos por consistencia) |

### Verificación (iteraciones 1 y 2)

- `npm test` ✅ (45 tests: mock-router, stock, sale-state-machine, auth/dev controllers, rutas, i18n paridad y utils).
- `npm run lint` ✅ (incluye regla `no-restricted-imports` de `src/mocks/**`).
- `npm run i18n:check` ✅ (161 claves con paridad es/en).
- `npm run build` ✅ en modo mock y en modo http; **el build http no incluye `src/mocks/`** (SC-005).

### Fase 3+ — Historias (US1–US12)

Ninguna historia está implementada (las pantallas borradas eran CRUD placeholder, no los flujos del plan).

| Hito | Historias | Pendiente |
|---|---|---|
| M1 | US1, US2 | T035–T049 — **US1 con motor de talle placeholder** (ver §7) |
| M2 | US3, US4, US7 | T050–T070 — catálogo, compra, admin de ventas |
| M3 | US5, US6 | T071–T083 — perfiles, direcciones, feedback, puntos, cupones |
| M4 | US8, US9 | T084–T093 — dashboard, inventario |
| M5 | US10–US12 | T094–T101 — analítica, exportación, reglas, modo asistente |
| F13 | Pulido | T102–T110 |

---

## 7. Decisión clave: motor de recomendación al final

El plan original ubica el `size-engine` en US1 (T035). **Cambio acordado:** la lógica completa de
recomendación (`agents/context/recommendation-engine.txt`) se implementa **al final** del prototipo.

- Mientras tanto, `POST /size-generations` debe devolver un **talle placeholder** (controller mock),
  de modo que US1 y todo el recorrido (catálogo → compra → admin) se puedan construir y demostrar
  sin depender del algoritmo definitivo.
- El algoritmo real (índices por contorno, huecos/superposiciones, diferencia de índices, cruce
  niño/adulto, advertencia de torso, etiquetas por línea) se integra recién cuando el ER y la capa
  de datos estén estables. Para ese momento ya estarán definidos los `SIZE` (rango por línea) y el
  contrato `POST /size-generations`.

> Nota: el nuevo motor depende de la tabla `SIZE` (rangos por línea) del ER nuevo, que aún no está
> sembrada. Otra razón para diferirlo.

---

## 8. Orden sugerido para la próxima iteración

1. ✅ Fase 1 + Fase 2 completas (setup, capa de datos y base UI).
2. **Próximo:** historias P1 en orden — **US1** (home con 3 caminos, `/fit` con precarga por `?line`, controller `size-generations` con talle placeholder, resultado con CTA de registro) → US2 (pantallas de auth reales con migración) → US3 (catálogo filtrado y sin stock) → US4 (checkout y coordinación) → US7 (admin de ventas) → checkpoint demo.
3. **Después:** US5 → US6 → US8 → US9 → US10–US12 → pulido.
4. **Al final:** integrar el motor de recomendación definitivo (`recommendation-engine.txt`).

---

## 9. Preguntas abiertas (del plan §9) — conviene validar temprano

| Prioridad | IDs | Tema |
|---|---|---|
| Alta | Q-01 | Matriz y regla de talle (afecta `SIZE` y el motor final) |
| Alta | Q-03 | Reserva derivada vs. transacción de stock |
| Alta | Q-11 | Vencimiento/recordatorio de reservas |
| Media | Q-04, Q-06, Q-07, Q-09, Q-12 | Transiciones, aviso de reposición, cupones, mensaje, faltantes por color |
| Baja | Q-02, Q-05, Q-08, Q-10, Q-13…Q-16 | fitType, migración en login, demográficos, rutas, formato, cambios, feedback invitado, marca |

---

## 10. Verificación realizada

- `npm run build` ✅ (vite build termina sin errores).
- `npm run lint` ✅ (sin errores).
- Resultado: el repo queda en un estado limpio y compilable, listo para empezar por §8.
