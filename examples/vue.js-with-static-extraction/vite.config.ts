import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import CSSExtractorPlugin from '@master/css-extractor.vite'

export default defineConfig({
    plugins: [
        vue(),
        CSSExtractorPlugin()
    ],
})
