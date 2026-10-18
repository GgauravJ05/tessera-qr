import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // The app claims to work offline, so it has to actually do so. Everything
    // it needs is static and already fingerprinted, which makes a plain
    // precache of the whole build the honest implementation: after one visit
    // the studio runs with no network at all.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // The lab and the proof wall are their own precached pages; only
        // unknown paths fall back to the studio.
        navigateFallbackDenylist: [/^\/lab/, /^\/gallery/],
      },
      manifest: {
        name: 'Tessera — QR code studio',
        short_name: 'Tessera',
        description:
          'Proof a QR code before the run. Links, WiFi, contacts and more, checked for scannability and exported print-ready, entirely on your device.',
        theme_color: '#d6d6d1',
        background_color: '#d6d6d1',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['utilities', 'productivity', 'developer'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  // One HTML entry per page of the sheet. Each is a real file in the build,
  // so /lab/ and /gallery/ are served as they are, with no rewrite rules for
  // Vercel to parse and nothing for the service worker to guess at.
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        lab: fileURLToPath(new URL('./lab/index.html', import.meta.url)),
        gallery: fileURLToPath(new URL('./gallery/index.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
    },
  },
});
