import { defineConfig, svgoOptimizer } from 'astro/config'
import { fileURLToPath } from 'node:url'
import svelte from '@astrojs/svelte'
import mdx from '@astrojs/mdx'
import { unified } from '@astrojs/markdown-remark'
import masterCSS from '@master/css-astro'
import site from './astro/integration'
import remarkSlugAndTOC from './docs-shell/remark/slug-and-toc.js'
import remarkMarkdownComponents from './docs-shell/remark/markdown-components.js'
import svgoConfig from './docs-shell/common/svgo.config.js'
import { readPublicEnv } from './utils/public-env.js'
import { shouldUseCloudflareImageLoader } from './utils/cloudflare-image-loader.js'

const publicEnv = readPublicEnv()
// Vite exposes PUBLIC_* process variables through import.meta.env.
Object.assign(process.env, publicEnv, {
  PUBLIC_IMAGE_TRANSFORMATIONS: String(shouldUseCloudflareImageLoader({ env: process.env, siteUrl: publicEnv.PUBLIC_URL }))
})

export default defineConfig({
  site: publicEnv.PUBLIC_URL,
  outDir: './out',
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  server: {
    port: 3000
  },
  markdown: {
    // Site components highlight code and typeset prose; Markdown keeps the authored characters.
    processor: unified({ remarkPlugins: [remarkSlugAndTOC, remarkMarkdownComponents], gfm: true, smartypants: false }),
    syntaxHighlight: false
  },
  vite: {
    server: {
      // A build writes thousands of files into outDir while a dev server may be
      // running; each one would otherwise be processed as a source change.
      watch: { ignored: [fileURLToPath(new URL('./out/**', import.meta.url))] }
    }
  },
  experimental: {
    svgOptimizer: svgoOptimizer(svgoConfig as Parameters<typeof svgoOptimizer>[0])
  },
  devToolbar: {
    enabled: false
  },
  // The site renderer must precede @astrojs/svelte, which supplies the Svelte Vite setup.
  integrations: [
    site(),
    svelte(),
    mdx(),
    masterCSS({ mode: 'progressive' })
  ]
})
