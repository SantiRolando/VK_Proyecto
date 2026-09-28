import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { aliases } from './vite.aliases.js'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: aliases },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    // Los tests de componentes hablan con el transporte mock: sin latencia
    // simulada ni fallos aleatorios, para que sean rápidos y deterministas.
    env: { VITE_MOCK_LATENCY_MS: '0', VITE_MOCK_FAIL_RATE: '0' },
    restoreMocks: true,
    // Los tests de componentes montan el router y los providers reales y
    // tipean en formularios de Mantine: con jsdom y varios archivos en
    // paralelo, el default de 5 s queda corto.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
