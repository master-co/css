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

// SvelteKit renders pages through its server hooks and never calls
// `transformIndexHtml`; SvelteKit 3 warns about every plugin that defines it.
function withoutIndexHTMLTransform(plugin: BasePlugin): BasePlugin {
  if (!plugin.transformIndexHtml) return plugin
  const kitPlugin = { ...plugin }
  delete kitPlugin.transformIndexHtml
  return kitPlugin
}

export function createMasterCSSVitePlugin(
  options: MasterCSSVitePluginOptions = {}
): BasePlugin[] {
  return [
    SvelteKitServerExternalPlugin(),
    ...createBaseMasterCSSVitePlugin({
      mode: 'static',
      ...options
    }).map(withoutIndexHTMLTransform)
  ]
}

export default createMasterCSSVitePlugin
