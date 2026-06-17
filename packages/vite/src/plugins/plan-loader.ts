import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import type { PluginContext } from '../core'
import { toResolvedMasterCSSPlanId } from '@master/css-integration/plan-module'
import { loadPlanJSON } from '@master/css-plan/load'
import { isCSSPlanRequest } from '@master/css-plan/css'
import { createMasterCSSPlanLoaderPlugin } from '@master/css-integration/plan-loader-plugin'

function invalidatePlanModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return module.importers.size > 0
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
