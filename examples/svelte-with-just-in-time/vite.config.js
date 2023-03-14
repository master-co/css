import { sveltekit } from '@sveltejs/kit/vite'
import path from 'path'

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        sveltekit()
    ],
    resolve: {
        alias: {
          src: path.resolve('./src')
        }
    }
}

export default config
