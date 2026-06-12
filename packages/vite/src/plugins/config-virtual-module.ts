import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { PluginContext } from '../core'
import { loadProjectPlan } from '@master/css-configer/load'
import { toPlanModule } from '@master/css-integration/plan-module'
import { RESOLVED_VIRTUAL_PLAN_ID, VIRTUAL_PLAN_ID } from '../common'
import { PluginOptions } from '../options'

function invalidateConfigModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return module.importers.size > 0
}

export default function ConfigVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    let cssConfigDependencies: string[] = []
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const loadDefaultPlan = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
        const result = await loadProjectPlan(context.config?.root)
        cssConfigDependencies = result.dependencies
        addServerAllow(result.dependencies)
        for (const dependency of result.dependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
        return result
    }
    return {
        name: 'master-css:virtual-module:config',
        enforce: 'pre',
        async buildStart() {
            await loadDefaultPlan(this)
        },
        async resolveId(id) {
            if (id === VIRTUAL_PLAN_ID) return RESOLVED_VIRTUAL_PLAN_ID
        },
        async load(id) {
            if (id === RESOLVED_VIRTUAL_PLAN_ID) {
                return toPlanModule((await loadDefaultPlan(this)).plan)
            }
        },
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            if (cssConfigDependencies.includes(file)) {
                handled = true
                needsFullReload ||= invalidateConfigModule(
                    server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_PLAN_ID),
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
