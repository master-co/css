import type { Plugin } from 'vite'
import {
  DEV_RUNTIME_ENTRY_ID,
  RUNTIME_ENTRY_ID
} from '../common'
import { ResolvedMasterCSSVitePluginOptions } from '../options'
import { toAssetHref } from '../utils/html'

export default function InjectRuntimePlugin(
  _options: ResolvedMasterCSSVitePluginOptions
): Plugin {
  return {
    name: 'master-css:inject-runtime',
    enforce: 'pre',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (
          html.includes(RUNTIME_ENTRY_ID)
          || html.includes(DEV_RUNTIME_ENTRY_ID)
        ) {
          return
        }
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: {
                type: 'module',
                src: RUNTIME_ENTRY_ID
              },
              injectTo: 'body'
            }
          ]
        }
      }
    }
  }
}

export function InjectRuntimeServePlugin(
  _options: ResolvedMasterCSSVitePluginOptions
): Plugin {
  return {
    name: 'master-css:inject-runtime:serve',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      handler(html, htmlContext) {
        if (
          html.includes(RUNTIME_ENTRY_ID)
          || html.includes(DEV_RUNTIME_ENTRY_ID)
        ) {
          return
        }
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: {
                type: 'module',
                src: toAssetHref(DEV_RUNTIME_ENTRY_ID, htmlContext.server?.config?.base, htmlContext.path)
              },
              injectTo: 'body'
            }
          ]
        }
      }
    }
  }
}
