import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so the same build works on Vercel and GitHub Pages (hash routing).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Tajweed Path · مسار التجويد',
        short_name: 'Tajweed Path',
        description: 'A daily tajweed study companion for Hafs, with review, recitation audio and a teacher log.',
        theme_color: '#0f5b45',
        background_color: '#f4f1e8',
        display: 'standalone',
        start_url: './#/today',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.includes('/data/'), handler: 'StaleWhileRevalidate', options: { cacheName: 'quran-data' } },
          { urlPattern: ({ url }) => url.hostname === 'everyayah.com', handler: 'CacheFirst',
            options: { cacheName: 'audio', rangeRequests: true, cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 400, maxAgeSeconds: 7 * 24 * 3600 } } },
          { urlPattern: ({ url }) => url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com'), handler: 'CacheFirst', options: { cacheName: 'fonts' } },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
})
