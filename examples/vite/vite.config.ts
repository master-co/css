import { MasterCSSVitePlugin } from '@master/css.vite'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        MasterCSSVitePlugin({ debug: true })
    ]
}

export default config