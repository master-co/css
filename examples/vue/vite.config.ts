import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { CSSExtractorPlugin } from '@master/css-extractor.vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        CSSExtractorPlugin()
    ],
})
