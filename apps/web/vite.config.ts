import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const API_DEV_ORIGIN = 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Both apps share the repository-root .env; only VITE_* variables reach the browser.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: API_DEV_ORIGIN, changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Framework code changes rarely, so it gets its own long-lived cacheable chunk.
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|@tanstack)[\\/]/,
              priority: 2,
            },
            // Icons are tiny and shared by most pages; one chunk beats dozens of sub-1 kB requests.
            { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
