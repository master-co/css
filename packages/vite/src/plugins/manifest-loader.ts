import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import type { PluginContext } from '../core'
import { toResolvedMasterCSSManifestId } from '@master/css-integration/node'
import { loadManifestJSON } from '@master/css-project/manifest'
import { isCSSManifestRequest } from '@master/css-project/entries'
import { createMasterCSSManifestLoaderPlugin } from '@master/css-integration/manifest-loader-plugin'
import {
    MANIFEST_ASSET_FILE,
    toBrowserManifestFacadeModule,
    toInlineManifestModule,
    toUniversalManifestFacadeModule
} from '@master/css-integration/manifest-facade'

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

export default function ManifestLoaderPlugin(context: PluginContext): Plugin {
    const cssManifestDependencies = new Map<string, string[]>()
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const watchManifestDependencies = (manifestPath: string, dependencies: string[] = []) => {
        cssManifestDependencies.set(manifestPath, dependencies)
        addServerAllow(dependencies)
    }
    const plugin = createMasterCSSManifestLoaderPlugin({
        cwd: context.config?.root,
        resolveUnresolved: false,
        async loadManifestJSON(manifestPath) {
            if (!isCSSManifestRequest(manifestPath)) {
                throw new TypeError('Master CSS manifest queries only support CSS entry files.')
            }
            return loadManifestJSON(manifestPath)
        },
        onLoadManifestJSON({ manifestPath, result }) {
            watchManifestDependencies(manifestPath, result.dependencies)
        },
        toManifestModule({ result, pluginContext }) {
            return createManifestModule(context, pluginContext, result.json)
        }
    })
    return {
        ...plugin,
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            const queryManifestPaths = new Set([file])
            for (const [manifestPath, dependencies] of cssManifestDependencies) {
                if (dependencies.includes(file)) queryManifestPaths.add(manifestPath)
            }
            for (const manifestPath of queryManifestPaths) {
                const queryModule = server.moduleGraph.getModuleById(toResolvedMasterCSSManifestId(manifestPath))
                if (!queryModule) continue
                handled = true
                needsFullReload ||= invalidateManifestModule(queryModule, server)
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
