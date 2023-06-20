import { CSSExtractorPlugin } from '@master/css-extractor.vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    vite: {
        plugins: [
            CSSExtractorPlugin()
        ]
    }
})
