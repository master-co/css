import {
  createMasterCSSVitePlugin as createBaseMasterCSSVitePlugin,
  type MasterCSSVitePluginOptions
} from '@master/css-vite'

type BasePlugin = ReturnType<typeof createBaseMasterCSSVitePlugin>[number]

const SVELTEKIT_SSR_EXTERNAL = ['@master/css-server']

function SvelteKitServerExternalPlugin(): BasePlugin {
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
): BasePlugin[] {
  return [
    SvelteKitServerExternalPlugin(),
    ...createBaseMasterCSSVitePlugin({
      mode: 'static',
      ...options
    })
  ]
}

export default createMasterCSSVitePlugin
