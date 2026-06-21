import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import type { PluginContext } from '../core'
import { toResolvedMasterCSSPlanId } from '@master/css-integration/node'
import { loadPlanJSON } from '@master/css-plan/load'
import { isCSSPlanRequest } from '@master/css-plan/css'
import { createMasterCSSPlanLoaderPlugin } from '@master/css-integration/plan-loader-plugin'
import {
    PLAN_ASSET_FILE,
    toBrowserPlanFacadeModule,
    toInlinePlanModule,
    toNodePlanFacadeModule
} from '@master/css-integration/plan-facade'

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

export default function PlanLoaderPlugin(context: PluginContext): Plugin {
    const cssPlanDependencies = new Map<string, string[]>()
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const watchPlanDependencies = (planPath: string, dependencies: string[] = []) => {
        cssPlanDependencies.set(planPath, dependencies)
        addServerAllow(dependencies)
    }
    const plugin = createMasterCSSPlanLoaderPlugin({
        cwd: context.config?.root,
        resolveUnresolved: false,
        async loadPlanJSON(planPath) {
            if (!isCSSPlanRequest(planPath)) {
                throw new TypeError('Master CSS plan queries only support CSS entry files.')
            }
            return loadPlanJSON(planPath)
        },
        onLoadPlanJSON({ planPath, result }) {
            watchPlanDependencies(planPath, result.dependencies)
        },
        toPlanModule({ result, pluginContext }) {
            return createPlanModule(context, pluginContext, result.json)
        }
    })
    return {
        ...plugin,
        async handleHotUpdate({ file, server }) {
            let handled = false
            let needsFullReload = false
            const queryPlanPaths = new Set([file])
            for (const [planPath, dependencies] of cssPlanDependencies) {
                if (dependencies.includes(file)) queryPlanPaths.add(planPath)
            }
            for (const planPath of queryPlanPaths) {
                const queryModule = server.moduleGraph.getModuleById(toResolvedMasterCSSPlanId(planPath))
                if (!queryModule) continue
                handled = true
                needsFullReload ||= invalidatePlanModule(queryModule, server)
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
