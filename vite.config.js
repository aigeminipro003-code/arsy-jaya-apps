import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Arsy Jaya Printing',
        short_name: 'Arsy Jaya',
        description: 'Production & Inventory - Sistem tracking produksi dan inventaris.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B1220',
        theme_color: '#1E4FD8',
        icons: [
          {
            src: '/logo_arsy.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
})
