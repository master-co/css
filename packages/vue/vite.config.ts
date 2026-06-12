import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { VIRTUAL_PLAN_ID } from '@master/css-integration/plan-module'
import { VIRTUAL_PRELOADED_ID } from '@master/css-integration/preloaded-module'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: [
                resolve(__dirname, 'src/index.ts'),
                resolve(__dirname, 'src/runtime-provider.ts'),
                resolve(__dirname, 'src/adapter.ts'),
                resolve(__dirname, 'src/vite.ts'),
            ],
            formats: ['es']
        },
        rollupOptions: {
            external: (id) => id === VIRTUAL_PLAN_ID ||
                id === VIRTUAL_PRELOADED_ID ||
                id === 'vue' ||
                id.startsWith('vue/') ||
                Object.keys(pkg.dependencies).some((dependency) =>
                    id === dependency || id.startsWith(`${dependency}/`)
                )
        },
    },
})
