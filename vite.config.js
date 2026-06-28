import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // Default globPatterns omits .webp — mascot images would be excluded from
        // the SW precache and fetched cold on every first load, causing broken-icon
        // flashes on slow networks. Explicitly include webp here.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
      manifest: {
        name: 'CBSE Math Kids',
        short_name: 'Math Kids',
        description: 'Fun math learning for CBSE students',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
