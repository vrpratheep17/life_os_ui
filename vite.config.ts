import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    injectRegister: false,
    includeAssets: ['icons/*.png'],
    manifest: {
      id: '/', name: 'Life OS', short_name: 'Life OS',
      description: 'Your goals, habits, and everyday moments.',
      start_url: '/dashboard', scope: '/', display: 'standalone',
      background_color: '#091d32', theme_color: '#091d32',
      icons: [
        { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,woff2,png,jpg}'],
      globIgnores: ['mockServiceWorker.js'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
      runtimeCaching: [{
        urlPattern: /\/models\/.*\.glb(?:\?.*)?$/i,
        handler: 'CacheFirst',
        options: { cacheName: 'lifeos-models', expiration: { maxEntries: 3, maxAgeSeconds: 30 * 24 * 60 * 60 }, cacheableResponse: { statuses: [200] } },
      }],
    },
  })],
})
