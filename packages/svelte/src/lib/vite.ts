import {
  createMasterCSSVitePlugin as createBaseMasterCSSVitePlugin,
  type MasterCSSVitePluginOptions
} from '@master/css-vite'
import type { Plugin } from 'vite'

export const SVELTEKIT_SSR_EXTERNAL = ['@master/css-server']

function SvelteKitServerExternalPlugin(): Plugin {
  return {
    name: 'master-css:svelte-kit-server-external',
    config() {
      return {
        ssr: {
          external: SVELTEKIT_SSR_EXTERNAL
        },
        build: {
          rollupOptions: {
            external: SVELTEKIT_SSR_EXTERNAL
          }
        }
      }
    }
  }
}

export function createMasterCSSVitePlugin(
  options: MasterCSSVitePluginOptions = {}
): Plugin[] {
  return [
    SvelteKitServerExternalPlugin(),
    ...createBaseMasterCSSVitePlugin({
      mode: 'progressive',
      ...options
    })
  ]
}
