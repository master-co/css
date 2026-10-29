import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import react from '@astrojs/react'
import masterCSS from '@master/css-astro'
import site from './astro/integration'
import { readPublicEnv } from './utils/public-env.js'
import { shouldUseCloudflareImageLoader } from './utils/cloudflare-image-loader.js'

const publicEnv = readPublicEnv()
const reactHelpers = ['react-intersection-observer', 'react-countup', 'usehooks-ts', 'use-debounce', '@master/styled.react']
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
  vite: {
    // Hoisted dependencies and site-local React must share one hooks dispatcher.
    environments: {
      ssr: { resolve: { noExternal: reactHelpers } },
      prerender: { resolve: { noExternal: reactHelpers } }
    },
    server: {
      // A build writes thousands of files into outDir while a dev server may be
      // running; each one would otherwise be processed as a source change.
      watch: { ignored: [fileURLToPath(new URL('./out/**', import.meta.url))] }
    }
  },
  devToolbar: {
    enabled: false
  },
  // The site renderer must precede @astrojs/react, which supplies the React Vite setup.
  integrations: [
    site(),
    react(),
    masterCSS({ mode: 'progressive' })
  ]
})
