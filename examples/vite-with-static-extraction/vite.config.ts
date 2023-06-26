import { defineConfig } from 'vite'
import { CSSExtractorPlugin } from '@master/css-extractor.vite'

export default defineConfig({
    plugins: [
        CSSExtractorPlugin({
            sources: [
                './index.html'
            ]
        })
    ]
})