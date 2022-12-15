import { defineConfig } from 'vite'
import { MasterCSSVitePlugin } from '@master/css.vite'

export default defineConfig({
    plugins: [
        MasterCSSVitePlugin({ debug: true })
    ]
})
