import { MasterCSSVitePlugin } from '@master/css.vite'

export default defineNuxtConfig({
    vite: {
        plugins: [
            MasterCSSVitePlugin()
        ]
    }
})
