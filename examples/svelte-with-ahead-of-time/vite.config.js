import { sveltekit } from '@sveltejs/kit/vite'
import { MasterCSSVitePlugin } from '@master/css.vite'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        sveltekit(),
        MasterCSSVitePlugin()
    ]
}

export default config
