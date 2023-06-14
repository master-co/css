import react from '@vitejs/plugin-react'

/* ahead-of-time */
// import { CSSExtractorPlugin } from '@master/css-extractor.vite'

/** @type {import('vite').UserConfig} */
export default {
    plugins: [
        react(),

        /* ahead-of-time */
        // CSSExtractorPlugin()
    ]
}