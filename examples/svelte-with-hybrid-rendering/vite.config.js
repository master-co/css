import { sveltekit } from '@sveltejs/kit/vite'
import { MasterCSSVitePlugin } from '@master/css.vite'
import upath from 'upath'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        sveltekit(),
        MasterCSSVitePlugin({ cwd: upath.resolve(process.cwd(), 'src') })
    ]
}

export default config
