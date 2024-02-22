import CSSExtractorPlugin from '@master/css-extractor.vite'

export default defineNuxtConfig({
    vite: {
        plugins: [
            CSSExtractorPlugin()
        ],
        define: {
            __NUXT_ASYNC_CONTEXT__: false
        }
    }
})
