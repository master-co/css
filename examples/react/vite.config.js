import react from '@vitejs/plugin-react'

/* ahead-of-time */
// import { MasterCSSVitePlugin } from '@master/css.vite'

/** @type {import('vite').UserConfig} */
export default {
    plugins: [
        react(),

        /* ahead-of-time */
        // MasterCSSVitePlugin()
    ]
}