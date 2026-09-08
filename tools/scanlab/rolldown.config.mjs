import { defineConfig } from 'rolldown';
import { fileURLToPath, URL } from 'node:url';

/**
 * Bundles the app's own encoding and styling modules into a single global the
 * harness page can load, so the lab renders exactly what users render.
 */
export default defineConfig({
  input: fileURLToPath(new URL('./page/entry.ts', import.meta.url)),
  output: {
    file: fileURLToPath(new URL('./page/vendor/tessera-lib.js', import.meta.url)),
    format: 'iife',
    name: 'TesseraLib',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
});
