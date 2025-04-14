import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import masterCSS from '@master/css.vite'

export default defineConfig({
    plugins: [
        vue(),
        masterCSS()
    ],
})
