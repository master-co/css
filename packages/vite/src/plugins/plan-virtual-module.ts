import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { PluginContext } from '../core'
import { loadProjectPlan } from '@master/css-plan/load'
import { toPlanJSON } from '@master/css-integration/plan-module'
import {
    PLAN_ASSET_FILE,
    toBrowserPlanFacadeModule,
    toInlinePlanModule,
    toNodePlanFacadeModule
} from '@master/css-integration/plan-facade'
import { RESOLVED_VIRTUAL_PLAN_ID, VIRTUAL_PLAN_ID } from '../common'
import { PluginOptions } from '../options'

function invalidatePlanModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
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

function createPlanModule(
    context: PluginContext,
    pluginContext: { emitFile?: (asset: { type: 'asset', name: string, source: string }) => string },
    json: string
) {
    if (!isProductionBuild(context) || !pluginContext.emitFile) return toInlinePlanModule(json)
    const referenceId = pluginContext.emitFile({
        type: 'asset',
        name: PLAN_ASSET_FILE,
        source: json
    })
    const urlExpression = `import.meta.ROLLUP_FILE_URL_${referenceId}`
    return isServerBuild(context)
        ? toNodePlanFacadeModule(urlExpression)
        : toBrowserPlanFacadeModule(urlExpression)
}

export default function PlanVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    let cssPlanDependencies: string[] = []
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const loadDefaultPlan = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
        const result = await loadProjectPlan(context.config?.root)
        cssPlanDependencies = result.dependencies
        addServerAllow(result.dependencies)
        for (const dependency of result.dependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
        return result
    }
    return {
        name: 'master-css:virtual-module:plan',
        enforce: 'pre',
        async buildStart() {
            await loadDefaultPlan(this)
        },
        async resolveId(id) {
            if (id === VIRTUAL_PLAN_ID) return RESOLVED_VIRTUAL_PLAN_ID
        },
        async load(id) {
            if (id === RESOLVED_VIRTUAL_PLAN_ID) {
                return createPlanModule(context, this, toPlanJSON((await loadDefaultPlan(this)).plan))
            }
        },
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            if (cssPlanDependencies.includes(file)) {
                handled = true
                needsFullReload ||= invalidatePlanModule(
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
