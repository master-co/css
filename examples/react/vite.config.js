import react from '@vitejs/plugin-react'
import { MasterCSSVitePlugin } from '@master/css.vite'

/** @type {import('vite').UserConfig} */
export default {
    plugins: [
        react(),
        MasterCSSVitePlugin()
    ],
}