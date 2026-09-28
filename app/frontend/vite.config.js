import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { aliases } from './vite.aliases.js'

// PWA (principio V): manifest + service worker con precache del shell. Todas las
// rutas son chunks propios, así que la app queda navegable sin conexión una vez
// visitada. El SW se auto-actualiza (`registerType: 'autoUpdate'`, sin UI de
// prompt) y, en modo `http`, los GET de `/api/` usan NetworkFirst para poder
// mostrar los últimos datos vistos sin conexión (las escrituras no se cachean).
//
// https://vite.dev/config/
export default defineConfig({
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
        theme_color: '#134379',
        background_color: '#E8F0FA',
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
        // La API nunca se resuelve con el shell de la app.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
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
})
