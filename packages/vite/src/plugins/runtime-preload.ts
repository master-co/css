import type { Plugin } from 'vite'
import {
  DEV_RUNTIME_ENTRY_ID,
  RUNTIME_ENTRY_ID
} from '../common'
import { RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID } from '@master/css-internal/runtime-bootstrap'
import type { MasterCSSVitePluginContext } from '../core'
import { hasModulePreloadLink, hasWasmPreloadLink, toAssetHref } from '../utils/html'

interface OutputChunkLike {
  type: string
  fileName?: string
  moduleIds?: string[]
  name?: string
  originalFileNames?: string[]
}

function findRuntimeWasmFileName(bundle: Record<string, OutputChunkLike>) {
  for (const output of Object.values(bundle)) {
    if (output.type !== 'asset' || !output.fileName?.endsWith('.wasm')) continue
    const names = [output.name, ...(output.originalFileNames || [])].filter(Boolean)
    if (
      output.fileName.includes('mastercss_wasm_runtime')
      || names.some((name) => name?.includes('mastercss_wasm_runtime'))
    ) {
      return output.fileName
    }
  }
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
          : htmlContext.server ? DEV_RUNTIME_ENTRY_ID : undefined
        const wasmFileName = bundle ? findRuntimeWasmFileName(bundle) : undefined
        const wasmHref = wasmFileName
          ? toAssetHref(wasmFileName, context.config?.base, htmlContext.path)
          : undefined
        const tags = []
        if (href && !hasModulePreloadLink(html, href)) {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'modulepreload',
              crossorigin: '',
              href
            },
            injectTo: 'head-prepend' as const
          })
        }
        if (wasmHref && !hasWasmPreloadLink(html, wasmHref)) {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'fetch',
              type: 'application/wasm',
              crossorigin: '',
              href: wasmHref
            },
            injectTo: 'head-prepend' as const
          })
        }
        if (!tags.length) return
        return {
          html,
          tags
        }
      }
    }
  }
}
