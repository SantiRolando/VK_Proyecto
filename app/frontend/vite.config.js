import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { aliases } from './vite.aliases.js'

/*
  Modo hybrid/http: el dev server reenvía `VITE_API_BASE_URL` (por defecto `/api`) al backend sin el prefijo, así el navegador habla
  con un solo origen y no hay CORS. En producción lo hace el reverse proxy.
*/
function apiProxy(env) {
  const prefix = env.VITE_API_BASE_URL ?? '/api'
  const target = env.VITE_BACKEND_URL ?? 'http://localhost:8080'
  return {
    [prefix]: {
      target,
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
    },
  }
}
/*
  Todas las rutas son chunks propios, así que la app queda navegable sin conexión una vez visitada. El SW se auto-actualiza
  (`registerType: 'autoUpdate'`) y, contra el backend, solo los GET públicos de `/api/public/` usan NetworkFirst para poder
  mostrarse sin conexión: lo que lleva sesión (perfiles, historial, panel) nunca se cachea, así otro usuario del mismo dispositivo
  no hereda datos ajenos.

  source: https://vite.dev/config/
*/

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    server: { proxy: apiProxy(env) },
    preview: { proxy: apiProxy(env) },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Scan VKFit',
          short_name: 'VKFit',
          description:
            'Recomendación de talle y compra coordinada de indumentaria de natación.',
          lang: 'es',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#1B1B1B',
          background_color: '#D5D5D5',
          categories: ['shopping', 'sports'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,jpg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /\/api\/public\//,
              method: 'GET',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'vkfit-api-get',
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [200] },
                expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: { alias: aliases },
  }
})
