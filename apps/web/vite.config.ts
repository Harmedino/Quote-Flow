import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Both apps share the repository-root .env; only VITE_* variables reach the browser.
const ENV_DIR = fileURLToPath(new URL('../../', import.meta.url));
const DEFAULT_API_PORT = '4000';

export default defineConfig(({ mode }) => {
  // The empty prefix also reads non-VITE_ variables (process.env wins over .env), so the proxy
  // follows the API's PORT. None of them reach the bundle; that is still envPrefix's job.
  const env = loadEnv(mode, ENV_DIR, '');
  const apiOrigin = `http://localhost:${env.PORT?.trim() || DEFAULT_API_PORT}`;

  return {
    plugins: [react(), tailwindcss()],
    envDir: ENV_DIR,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      // `vite preview` reuses this proxy.
      proxy: {
        '/api': { target: apiOrigin, changeOrigin: true },
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
  };
});
