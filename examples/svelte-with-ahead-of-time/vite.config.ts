import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { CSSExtractorPlugin } from '@master/css-extractor.vite'

export default defineConfig({
    plugins: [
        sveltekit(),
        CSSExtractorPlugin({ sources: ['./src/app.html'] })
    ]
})
