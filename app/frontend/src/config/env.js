// Configuración de entorno tipada.
// Vite reemplaza `import.meta.env.VITE_*` en build; los `??` cubren los
// valores por defecto en tests y en modo desarrollo sin .env.
//
// Modos de datos:
//   - `mock`: todo contra la base local en localStorage.
//   - `http`: todo contra la API real.
//   - `hybrid`: la API real para lo que ya implementa (`backend-coverage.js`)
//     y el mock para el resto, así la app se recorre completa mientras el
//     backend crece.

const apiMode = import.meta.env.VITE_API_MODE ?? 'mock'

export const env = {
  apiMode,
  isMock: apiMode === 'mock',
  isHttp: apiMode === 'http',
  isHybrid: apiMode === 'hybrid',
  usesBackend: apiMode === 'http' || apiMode === 'hybrid',
  // Ayudas de desarrollo (cuentas demo, pista del código OTP): nunca en un build.
  showDevHints: Boolean(import.meta.env.DEV) && apiMode !== 'http',
  // Prefijo que el dev server reenvía al backend (ver `vite.config.js`).
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  mockLatencyMs: import.meta.env.VITE_MOCK_LATENCY_MS ?? '250-600',
  mockFailRate: Number(import.meta.env.VITE_MOCK_FAIL_RATE ?? 0),
}
