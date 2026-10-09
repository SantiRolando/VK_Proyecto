/*
  Configuración de entorno: Vite reemplaza `import.meta.env.VITE_*` en build y los `??` cubren
  los tests y el desarrollo sin `.env`. Modos de datos: `mock` resuelve todo contra la base
  local, `http` contra la API real y `hybrid` combina los dos según `backend-coverage.js`.
*/

const apiMode = import.meta.env.VITE_API_MODE ?? 'mock'

export const env = {
  isMock: apiMode === 'mock',
  isHybrid: apiMode === 'hybrid',
  // Ayudas de desarrollo (cuentas demo, pista del código OTP): visibles en cualquier build.
  showDevHints: true,
  // Prefijo que el dev server reenvía al backend (ver `vite.config.js`).
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  // Latencia simulada (`min-max`, en ms) y probabilidad de fallo de cada respuesta.
  mockLatencyMs: import.meta.env.VITE_MOCK_LATENCY_MS ?? '250-600',
  mockFailRate: Number(import.meta.env.VITE_MOCK_FAIL_RATE ?? 0),
}
