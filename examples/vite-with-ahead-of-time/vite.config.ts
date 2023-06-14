import { CSSExtractorPlugin } from '@master/css-extractor.vite'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        CSSExtractorPlugin({
            sources: [
                './index.html'
            ]
        })
    ]
}

export default config