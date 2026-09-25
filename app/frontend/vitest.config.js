import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    // Los tests de componentes hablan con el transporte mock: sin latencia
    // simulada ni fallos aleatorios, para que sean rápidos y deterministas.
    env: { VITE_MOCK_LATENCY_MS: '0', VITE_MOCK_FAIL_RATE: '0' },
    restoreMocks: true,
  },
})
