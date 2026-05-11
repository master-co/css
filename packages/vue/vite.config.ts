import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: [
                resolve(__dirname, 'src/index.ts'),
                resolve(__dirname, 'src/adapter.ts'),
                resolve(__dirname, 'src/vite.ts'),
            ],
            formats: ['es']
        },
        rollupOptions: {
            external: (id) => id === 'vue' ||
                id.startsWith('vue/') ||
                Object.keys(pkg.dependencies).some((dependency) =>
                    id === dependency || id.startsWith(`${dependency}/`)
                )
        },
    },
})
