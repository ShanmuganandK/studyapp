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
        //
        // woff2 likewise: the fonts are self-hosted and bundled (no CDN), but omitting
        // them from the precache meant an offline first load fell back to system fonts,
        // losing the Baloo 2 / Nunito type identity exactly when connectivity is worst.
        // Confirmed still open by the 2026-08-15 network audit.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
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
