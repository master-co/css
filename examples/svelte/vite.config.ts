import adapter from '@sveltejs/adapter-vercel'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import masterCSS from '@master/css-svelte/vite'

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      // See https://svelte.dev/docs/kit/adapters for more information about adapters.
      adapter: adapter()
    }),
    masterCSS({ mode: 'progressive' }),
  ]
})
