import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import type { PluginContext } from '../core'
import { toResolvedMasterCSSConfigId } from '@master/css-integration/config-module'
import { toResolvedMasterCSSPlanId } from '@master/css-integration/plan-module'
import { loadConfigModule } from '@master/css-configer/load'
import { isCSSConfigRequest } from '@master/css-configer/css'
import { createMasterCSSConfigLoaderPlugin } from '@master/css-integration/config-loader-plugin'

function invalidateConfigModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return module.importers.size > 0
}

export default function ConfigLoaderPlugin(context: PluginContext): Plugin {
    const cssConfigDependencies = new Map<string, string[]>()
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const watchConfigDependencies = (configPath: string, dependencies: string[] = []) => {
        cssConfigDependencies.set(configPath, dependencies)
        addServerAllow(dependencies)
    }
    const plugin = createMasterCSSConfigLoaderPlugin({
        cwd: context.config?.root,
        resolveUnresolved: false,
        async loadConfigModule(configPath) {
            if (!isCSSConfigRequest(configPath)) {
                throw new TypeError('Master CSS config queries only support CSS entry files.')
            }
            return loadConfigModule(configPath)
        },
        onLoadConfigModule({ configPath, result }) {
            watchConfigDependencies(configPath, result.dependencies)
        }
    })
    return {
        ...plugin,
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            const queryConfigPaths = new Set([file])
            for (const [configPath, dependencies] of cssConfigDependencies) {
                if (dependencies.includes(file)) queryConfigPaths.add(configPath)
            }
            for (const configPath of queryConfigPaths) {
                for (const queryId of [
                    toResolvedMasterCSSConfigId(configPath),
                    toResolvedMasterCSSPlanId(configPath)
                ]) {
                    const queryModule = server.moduleGraph.getModuleById(queryId)
                    if (!queryModule) continue
                    handled = true
                    needsFullReload ||= invalidateConfigModule(queryModule, server)
                }
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
