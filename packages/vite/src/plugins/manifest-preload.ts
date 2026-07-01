import type { Plugin } from 'vite'
import {
    MANIFEST_ASSET_FILE,
    toManifestPreloadLinkAttrs
} from '@master/css-integration/manifest-facade'
import type { PluginContext } from '../core'
import { hasModulePreloadLink, toAssetHref } from '../utils/html'

interface OutputAssetLike {
    type: string
    name?: string
    names?: string[]
    fileName?: string
    source?: unknown
}

function findDefaultManifestAssetFileName(context: PluginContext, bundle: Record<string, OutputAssetLike>) {
    const source = context.defaultManifestAssetSource
    if (!source) return
    for (const output of Object.values(bundle)) {
        if (
            output.type === 'asset'
            && (output.name === MANIFEST_ASSET_FILE || output.names?.includes(MANIFEST_ASSET_FILE))
            && output.source === source
        ) {
            return output.fileName
        }
    }
}

export default function ManifestPreloadPlugin(context: PluginContext): Plugin {
    return {
        name: 'master-css:manifest-preload',
        apply: 'build',
        transformIndexHtml: {
            order: 'post',
            handler(html, htmlContext) {
                if (!context.defaultManifestAssetReferenceId || !htmlContext.bundle) return
                const fileName = findDefaultManifestAssetFileName(context, htmlContext.bundle as Record<string, OutputAssetLike>)
                if (!fileName) return
                const href = toAssetHref(fileName, context.config?.base, htmlContext.path)
                if (hasModulePreloadLink(html, href, { as: 'json' })) return
                return {
                    html,
                    tags: [
                        {
                            tag: 'link',
                            attrs: { ...toManifestPreloadLinkAttrs(href) },
                            injectTo: 'head-prepend'
                        }
                    ]
                }
            }
        }
    }
}
