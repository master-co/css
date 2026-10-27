import type { Plugin } from 'vite'
import {
  DEV_RUNTIME_ENTRY_ID,
  RUNTIME_ENTRY_ID
} from '../common'
import { RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID } from '@master/css-internal/runtime-bootstrap'
import type { MasterCSSVitePluginContext } from '../core'
import { hasModulePreloadLink, toAssetHref } from '../utils/html'

interface OutputChunkLike {
  type: string
  fileName?: string
  moduleIds?: string[]
}

function isRuntimeModuleId(id: string) {
  const normalized = id.replace(/\\/g, '/')
  return normalized === RUNTIME_ENTRY_ID
    || normalized === RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
}

function findRuntimeChunkFileName(bundle: Record<string, OutputChunkLike>) {
  for (const output of Object.values(bundle)) {
    if (
      output.type === 'chunk'
      && output.fileName
      && output.moduleIds?.some(isRuntimeModuleId)
    ) {
      return output.fileName
    }
  }
}

export default function RuntimePreloadPlugin(context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:runtime-preload',
    transformIndexHtml: {
      order: 'post',
      handler(html, htmlContext) {
        const bundle = htmlContext.bundle as Record<string, OutputChunkLike> | undefined
        const fileName = bundle
          ? findRuntimeChunkFileName(bundle)
          : undefined
        const href = fileName
          ? toAssetHref(fileName, context.config?.base, htmlContext.path)
          : htmlContext.server
            ? toAssetHref(DEV_RUNTIME_ENTRY_ID, htmlContext.server.config?.base ?? context.config?.base, htmlContext.path)
            : undefined
        if (!href || hasModulePreloadLink(html, href)) return
        return {
          html,
          tags: [{
            tag: 'link',
            attrs: {
              rel: 'modulepreload',
              crossorigin: '',
              href
            },
            injectTo: 'head-prepend' as const
          }]
        }
      }
    }
  }
}
