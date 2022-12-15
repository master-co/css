import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import MasterCSSVitePlugin from '@master/css.vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        MasterCSSVitePlugin({ debug: true }),
        vue()
    ]
})
