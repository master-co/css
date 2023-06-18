import { defineConfig } from 'astro/config'
import { CSSExtractorPlugin } from '@master/css-extractor.vite'

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [CSSExtractorPlugin()]
    }
})
