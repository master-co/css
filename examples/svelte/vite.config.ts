import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import masterCSS from '@master/css.vite'

export default defineConfig({
    plugins: [
        sveltekit(),
        masterCSS({ mode: 'extract' })
    ],
    server: {
        fs: {
            allow: ['./master.css.ts']
        }
    }
})
