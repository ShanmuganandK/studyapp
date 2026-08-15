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
        //
        // Scoped to the LATIN subsets on purpose: PRECACHED SUBSETS TRACK RENDERED SCRIPTS.
        // Fontsource ships each family split by unicode-range (latin, latin-ext, cyrillic,
        // vietnamese, devanagari), and the browser only FETCHES the ranges a page actually
        // uses — but precaching is indiscriminate, so an unscoped `woff2` glob downloads all
        // nine on install (~316 kB) to render ~72 kB of Latin. We render no Devanagari,
        // Cyrillic or Vietnamese today. Revisit this line if UI localisation ships — the
        // subsets precached must then follow the scripts actually rendered.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}', '**/*-latin-wght-normal-*.woff2'],
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
