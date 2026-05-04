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
                config.server.fs.allow.push(context.configPath)
            }
        },
        buildStart() {
            if (context.configPath) this.addWatchFile(context.configPath)
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
                        return toConfigModule(await loadConfig(context.configPath))
                    }
                    return `import config from ${JSON.stringify(context.configPath)}; export default config;`
                } else {
                    return `export default {}`
                }
            }
            const configPath = fromResolvedMasterCSSConfigId(id)
            if (configPath) {
                this.addWatchFile(configPath)
                return toConfigModule(await loadConfig(configPath))
            }
        },
        async handleHotUpdate({ file, server }) {
            const modules = []
            if (file === context.configPath) {
                await context.extractor?.reset(context.extractor.options)
                const module = invalidateImportedConfigModule(
                    server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_CONFIG_ID),
                    server
                )
                if (module) {
                    modules.push(module)
                }
            }
            const queryModule = invalidateImportedConfigModule(
                server.moduleGraph.getModuleById(toResolvedMasterCSSConfigId(file)),
                server
            )
            if (queryModule) {
                modules.push(queryModule)
            }
            if (modules.length) return modules
        }
    }
}
