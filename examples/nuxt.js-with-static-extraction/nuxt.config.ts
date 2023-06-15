import { CSSExtractorPlugin } from '@master/css-extractor.vite'

export default defineNuxtConfig({
    vite: {
        plugins: [
            CSSExtractorPlugin()
        ]
    }
})
