import { defineConfig } from 'astro/config'
import masterCSS from '@master/css.vite'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
    compressHTML: true,
    trailingSlash: 'never',
    integrations: [sitemap()],
    vite: {
        plugins: [masterCSS()]
    }
})
