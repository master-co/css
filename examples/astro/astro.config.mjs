import { defineConfig } from 'astro/config'
import masterCSS from '@master/css.astro'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
    compressHTML: true,
    trailingSlash: 'never',
    integrations: [
        sitemap(),
        masterCSS()
    ]
})
