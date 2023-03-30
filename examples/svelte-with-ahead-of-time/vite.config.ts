import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { MasterCSSVitePlugin } from '@master/css.vite'

export default defineConfig({
	plugins: [
        sveltekit(),
        MasterCSSVitePlugin()
    ]
})
