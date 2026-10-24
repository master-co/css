import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import masterCSS from '@master/css-astro'
import site from './astro/integration'
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
