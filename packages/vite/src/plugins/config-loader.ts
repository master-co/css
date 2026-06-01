import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { PluginContext } from '../core'
import { loadConfigModule } from '@master/css-configer/load'
import {
    fromResolvedMasterCSSConfigId,
    isMasterCSSConfigRequest,
    stripMasterCSSConfigQuery,
    toResolvedMasterCSSConfigId
} from '@master/css-configer/module'

function invalidateConfigModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return module.importers.size > 0
}

export function ConfigLoaderPlugin(context: PluginContext): Plugin {
    const cssConfigDependencies = new Map<string, string[]>()
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const watchConfigDependencies = (pluginContext: { addWatchFile?: (id: string) => void }, configPath: string, dependencies: string[] = []) => {
        cssConfigDependencies.set(configPath, dependencies)
        addServerAllow(dependencies)
        for (const dependency of dependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
    }
    return {
        name: 'master-css:config-loader',
        enforce: 'pre',
        async resolveId(id, importer) {
            if (!isMasterCSSConfigRequest(id)) return
            const sourceId = stripMasterCSSConfigQuery(id)
            const resolved = await this.resolve(sourceId, importer, { skipSelf: true })
            if (resolved) return toResolvedMasterCSSConfigId(resolved.id)
        },
        async load(id) {
            const configPath = fromResolvedMasterCSSConfigId(id)
            if (!configPath) return
            const result = await loadConfigModule(configPath)
            watchConfigDependencies(this, configPath, result.dependencies)
            return result.code
        },
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            const queryConfigPaths = new Set([file])
            for (const [configPath, dependencies] of cssConfigDependencies) {
                if (dependencies.includes(file)) queryConfigPaths.add(configPath)
            }
            for (const configPath of queryConfigPaths) {
                const queryModule = server.moduleGraph.getModuleById(toResolvedMasterCSSConfigId(configPath))
                if (!queryModule) continue
                handled = true
                needsFullReload ||= invalidateConfigModule(queryModule, server)
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
