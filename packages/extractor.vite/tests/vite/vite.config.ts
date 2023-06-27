import { CSSExtractorPlugin } from '@master/css-extractor.vite'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        CSSExtractorPlugin()
    ]
}

export default config