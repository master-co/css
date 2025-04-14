import masterCSS from '@master/css.vite'

export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    vite: {
        plugins: [
            masterCSS()
        ]
    }
})
