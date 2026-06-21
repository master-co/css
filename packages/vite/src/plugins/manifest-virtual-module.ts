import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { PluginContext } from '../core'
import { loadProjectManifest } from '@master/css-manifest/load'
import { toManifestJSON } from '@master/css-integration/manifest-module'
import {
    MANIFEST_ASSET_FILE,
    toBrowserManifestFacadeModule,
    toInlineManifestModule,
    toUniversalManifestFacadeModule
} from '@master/css-integration/manifest-facade'
import { RESOLVED_VIRTUAL_MANIFEST_ID, VIRTUAL_MANIFEST_ID } from '../common'
import { PluginOptions } from '../options'

function invalidateManifestModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return module.importers.size > 0
}

function isProductionBuild(context: PluginContext) {
    return context.config?.command === 'build'
}

function isServerBuild(context: PluginContext) {
    return Boolean(context.config?.build.ssr)
}

function createManifestModule(
    context: PluginContext,
    pluginContext: { emitFile?: (asset: { type: 'asset', name: string, source: string }) => string },
    json: string
) {
    if (!isProductionBuild(context) || !pluginContext.emitFile) return toInlineManifestModule(json)
    const referenceId = pluginContext.emitFile({
        type: 'asset',
        name: MANIFEST_ASSET_FILE,
        source: json
    })
    const urlExpression = `import.meta.ROLLUP_FILE_URL_${referenceId}`
    return isServerBuild(context)
        ? toUniversalManifestFacadeModule(urlExpression)
        : toBrowserManifestFacadeModule(urlExpression)
}

export default function ManifestVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    let cssManifestDependencies: string[] = []
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const loadDefaultManifest = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
        const result = await loadProjectManifest(context.config?.root)
        cssManifestDependencies = result.dependencies
        addServerAllow(result.dependencies)
        for (const dependency of result.dependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
        return result
    }
    return {
        name: 'master-css:virtual-module:manifest',
        enforce: 'pre',
        async buildStart() {
            await loadDefaultManifest(this)
        },
        async resolveId(id) {
            if (id === VIRTUAL_MANIFEST_ID) return RESOLVED_VIRTUAL_MANIFEST_ID
        },
        async load(id) {
            if (id === RESOLVED_VIRTUAL_MANIFEST_ID) {
                return createManifestModule(context, this, toManifestJSON((await loadDefaultManifest(this)).manifest))
            }
        },
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            if (cssManifestDependencies.includes(file)) {
                handled = true
                needsFullReload ||= invalidateManifestModule(
                    server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MANIFEST_ID),
                    server
                )
            }
            if (needsFullReload) {
                server.ws.send({
                    type: 'full-reload',
                    path: '*',
                    triggeredBy: file
                })
            }
            if (handled) return []
        }
    }
}
