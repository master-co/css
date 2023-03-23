import { sveltekit } from '@sveltejs/kit/vite'
import { MasterCSSVitePlugin } from '@master/css.vite'
import upath from 'upath'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        sveltekit(),
        MasterCSSVitePlugin({ config: './src/master.css.ts' })
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    master: ['master.css']
                }
            }
        }
    }
}

export default config
