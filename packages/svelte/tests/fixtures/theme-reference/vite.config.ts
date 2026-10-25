import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import masterCSS from '../../../dist/vite.js'

export default defineConfig({
  plugins: [
    sveltekit({ preprocess: vitePreprocess(), adapter: { name: 'test', async adapt() {} } }),
    masterCSS()
  ]
})
