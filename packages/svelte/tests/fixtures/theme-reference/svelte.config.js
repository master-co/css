import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  kit: { adapter: { name: 'test', async adapt() {} } }
}
