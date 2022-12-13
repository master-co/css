import { sveltekit } from '@sveltejs/kit/vite'
import MasterCSSVitePlugin from '@master/css.vite'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        MasterCSSVitePlugin({
            output: {
                dir: 'src/routes'
            },
            additions: [
                'src/app.html'
            ]
        }),
        sveltekit()
    ]
}

export default config
