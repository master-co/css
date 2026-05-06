import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { PluginContext } from '../core'
import exploreConfig, { loadConfig } from '@master/css-explore-config'
import { MASTER_CSS_CONFIG_QUERY, RESOLVED_VIRTUAL_CONFIG_ID, VIRTUAL_CONFIG_ID } from '../common'
import { PluginOptions } from '../options'
import {
    fromResolvedMasterCSSConfigId,
    stripMasterCSSConfigQuery,
    toConfigModule,
    toResolvedMasterCSSConfigId
} from '../utils/config-module'

function invalidateImportedConfigModule(module: ModuleNode | undefined, server: ViteDevServer) {
    if (!module) return
    server.moduleGraph.invalidateModule(module)
    if (module.importers.size) return module
}

export function ConfigVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    const cssConfigDependencies = new Map<string, string[]>()
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const watchConfigDependencies = (pluginContext: { addWatchFile?: (id: string) => void }, configPath?: string, dependencies: string[] = []) => {
        if (!configPath) return
        cssConfigDependencies.set(configPath, dependencies)
        addServerAllow(dependencies)
        for (const dependency of dependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
    }
    return {
        name: 'master-css:virtual-module:config',
        enforce: 'pre',
        async configResolved(config) {
            context.configResult = await exploreConfig({ name: options.config, cwd: config.root })
            context.configPath = context.configResult?.path
            if (process.env.DEBUG) {
                console.log(`[@master/css.vite] config: ${context.configPath || 'none'}`)
            }
            if (context.configPath) {
                const dependencies = context.configResult?.dependencies || [context.configPath]
                cssConfigDependencies.set(context.configPath, dependencies)
                for (const dependency of dependencies) {
                    if (!config.server.fs.allow.includes(dependency)) {
                        config.server.fs.allow.push(dependency)
                    }
                }
            }
        },
        buildStart() {
            watchConfigDependencies(this, context.configPath, context.configResult?.dependencies || [])
        },
        async resolveId(id, importer) {
            if (id === VIRTUAL_CONFIG_ID) return RESOLVED_VIRTUAL_CONFIG_ID
            if (id.endsWith(MASTER_CSS_CONFIG_QUERY)) {
                const sourceId = stripMasterCSSConfigQuery(id)
                const resolved = await this.resolve(sourceId, importer, { skipSelf: true })
                if (resolved) return toResolvedMasterCSSConfigId(resolved.id)
            }
        },
        async load(id) {
            if (id === RESOLVED_VIRTUAL_CONFIG_ID) {
                if (context.configPath) {
                    if (context.configResult?.extension === 'css') {
                        const result = await loadConfig(context.configPath)
                        context.configResult.config = result.config
                        context.configResult.dependencies = result.dependencies
                        watchConfigDependencies(this, context.configPath, result.dependencies)
                        return toConfigModule(result.config)
                    }
                    return `import config from ${JSON.stringify(context.configPath)}; export default config;`
                } else {
                    return `export default {}`
                }
            }
            const configPath = fromResolvedMasterCSSConfigId(id)
            if (configPath) {
                const result = await loadConfig(configPath)
                watchConfigDependencies(this, configPath, result.dependencies)
                return toConfigModule(result.config)
            }
        },
        async handleHotUpdate({ file, server }) {
            const modules = []
            const defaultConfigDependencies = context.configPath
                ? cssConfigDependencies.get(context.configPath) || [context.configPath]
                : []
            if (defaultConfigDependencies.includes(file)) {
                await context.extractor?.reset(context.extractor.options)
                const module = invalidateImportedConfigModule(
                    server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_CONFIG_ID),
                    server
                )
                if (module) {
                    modules.push(module)
                }
            }
            const queryConfigPaths = new Set([file])
            for (const [configPath, dependencies] of cssConfigDependencies) {
                if (dependencies.includes(file)) queryConfigPaths.add(configPath)
            }
            for (const configPath of queryConfigPaths) {
                const queryModule = invalidateImportedConfigModule(
                    server.moduleGraph.getModuleById(toResolvedMasterCSSConfigId(configPath)),
                    server
                )
                if (queryModule) {
                    modules.push(queryModule)
                }
            }
            if (modules.length) return modules
        }
    }
}
