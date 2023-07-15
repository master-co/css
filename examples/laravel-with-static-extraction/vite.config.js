import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import { CSSExtractorPlugin } from '@master/css-extractor.vite'

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        CSSExtractorPlugin({
            sources: ['resources/views/**/*.php']
        })
    ],
})
