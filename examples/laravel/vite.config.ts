import react from '@vitejs/plugin-react';
import masterCSS from '@master/css-vite';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react(),
    masterCSS({ mode: 'static' }),
  ],
  resolve: {
    alias: {
      'ziggy-js': resolve(import.meta.dirname, 'vendor/tightenco/ziggy'),
    },
  },
});
