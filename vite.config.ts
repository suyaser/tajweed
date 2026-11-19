import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { isAudio, isFont, isQuranData } from './src/pwa/routes'

// Relative base so the same build works on Vercel and GitHub Pages (hash routing).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // prompt: main.tsx applies an update only on Today, so a deploy never reloads a class or a recording.
      registerType: 'prompt',
      manifest: {
        name: 'Tajweed Path · مسار التجويد',
        short_name: 'Tajweed Path',
        description: 'A daily tajweed study companion for Hafs, with review, recitation audio and a teacher log.',
        theme_color: '#0f5b45',
        background_color: '#f4f1e8',
        display: 'standalone',
        start_url: './#/today',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
        clientsClaim: true,
        // Order matters: the first match wins (review B1).
        runtimeCaching: [
          { urlPattern: isAudio, handler: 'CacheFirst',
            options: { cacheName: 'audio', rangeRequests: true, cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 400, maxAgeSeconds: 7 * 24 * 3600, purgeOnQuotaError: true } } },
          { urlPattern: isQuranData, handler: 'StaleWhileRevalidate', options: { cacheName: 'quran-data' } },
          { urlPattern: isFont, handler: 'CacheFirst',
            options: { cacheName: 'fonts', cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 3600, purgeOnQuotaError: true } } },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
})
