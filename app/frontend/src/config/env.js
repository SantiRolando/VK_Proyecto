// Configuración de entorno tipada.
// Vite reemplaza `import.meta.env.VITE_*` en build; los `??` cubren los
// valores por defecto en tests y en modo desarrollo sin .env.

const apiMode = import.meta.env.VITE_API_MODE ?? 'mock'

export const env = {
  apiMode,
  isMock: apiMode === 'mock',
  isHttp: apiMode === 'http',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  mockLatencyMs: import.meta.env.VITE_MOCK_LATENCY_MS ?? '250-600',
  mockFailRate: Number(import.meta.env.VITE_MOCK_FAIL_RATE ?? 0),
}
