import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: [
                resolve(__dirname, 'src/CSSProvider.ts'),
                resolve(__dirname, 'src/index.ts'),
            ],
            formats: ['cjs', 'es']
        },
        rollupOptions: {
            external: ['vue', ...Object.keys(pkg.dependencies)]
        },
    },
});