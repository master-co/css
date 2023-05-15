import { MasterCSSVitePlugin } from '@master/css.vite'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        MasterCSSVitePlugin({
            sources: [
                './index.html'
            ]
        })
    ]
}

export default config