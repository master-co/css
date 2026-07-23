import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { createMasterCSSVitePlugin } from '@master/css-svelte/vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    createMasterCSSVitePlugin(),
  ]
})
