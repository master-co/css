import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import masterSite from '@master/internal-site/astro'
import siteConfig from './site.config'
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
  vite: {
    server: {
      // A build writes thousands of files into outDir while a dev server may be
      // running; each one would otherwise be processed as a source change.
      watch: { ignored: [fileURLToPath(new URL('./out/**', import.meta.url))] }
    }
  },
  devToolbar: {
    enabled: false
  },
  integrations: [masterSite(siteConfig)]
})
