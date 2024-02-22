import { defineConfig } from 'astro/config'
import CSSExtractorPlugin from '@master/css-extractor.vite'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
    compressHTML: true,
    trailingSlash: 'never',
    integrations: [sitemap()],
    vite: {
        plugins: [CSSExtractorPlugin()]
    }
})
