import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import sourceURL from './source-url'
import serverStyles from './server-styles'
import svgMarkup from './svg-markup'

/** Site build conventions: Svelte roots with the site context, optimized SVG markup and server-only stylesheets. */
export default function siteIntegration(): AstroIntegration {
  return {
    name: 'master-css-site',
    hooks: {
      'astro:config:setup': ({ addRenderer, updateConfig }) => {
        // Registered before `@astrojs/svelte`, whose Vite setup it reuses, so Svelte roots render here.
        addRenderer({
          name: 'master-css-site:svelte',
          serverEntrypoint: fileURLToPath(new URL('./svelte-renderer.ts', import.meta.url)),
          clientEntrypoint: '@astrojs/svelte/client.js'
        })
        updateConfig({ vite: { plugins: [sourceURL(), serverStyles(), svgMarkup()] } })
      }
    }
  }
}
