import { defineConfig } from 'astro/config'
import { MasterCSSVitePlugin } from '@master/css.vite'

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [MasterCSSVitePlugin()]
    }
})
