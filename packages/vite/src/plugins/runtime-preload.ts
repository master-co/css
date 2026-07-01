import type { Plugin } from 'vite'
import {
    DEV_RUNTIME_ENTRY_ID,
    RUNTIME_ENTRY_ID
} from '../common'
import type { PluginContext } from '../core'
import { hasModulePreloadLink, toAssetHref } from '../utils/html'

interface OutputChunkLike {
    type: string
    fileName?: string
    moduleIds?: string[]
}

function isRuntimeModuleId(id: string) {
    const normalized = id.replace(/\\/g, '/')
    return normalized === RUNTIME_ENTRY_ID
        || normalized.endsWith('/@master/css.vite/dist/runtime.js')
        || normalized.endsWith('/packages/vite/dist/runtime.js')
        || normalized.endsWith('/packages/vite/src/runtime.ts')
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

export default function RuntimePreloadPlugin(context: PluginContext): Plugin {
    return {
        name: 'master-css:runtime-preload',
        transformIndexHtml: {
            order: 'post',
            handler(html, htmlContext) {
                const fileName = htmlContext.bundle
                    ? findRuntimeChunkFileName(htmlContext.bundle as Record<string, OutputChunkLike>)
                    : undefined
                const href = fileName
                    ? toAssetHref(fileName, context.config?.base, htmlContext.path)
                    : htmlContext.server ? DEV_RUNTIME_ENTRY_ID : undefined
                if (!href || hasModulePreloadLink(html, href)) return
                return {
                    html,
                    tags: [
                        {
                            tag: 'link',
                            attrs: {
                                rel: 'modulepreload',
                                crossorigin: '',
                                href
                            },
                            injectTo: 'head-prepend'
                        }
                    ]
                }
            }
        }
    }
}
