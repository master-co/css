import react from '@vitejs/plugin-react'

/* static-extraction */
// import { CSSExtractorPlugin } from '@master/css-extractor.vite'

/** @type {import('vite').UserConfig} */
export default {
    plugins: [
        react(),

        /* static-extraction */
        // CSSExtractorPlugin()
    ]
}