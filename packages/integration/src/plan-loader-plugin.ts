import { dirname, isAbsolute, resolve } from 'node:path'
import {
    fromResolvedMasterCSSPlanId,
    isMasterCSSPlanRequest,
    stripMasterCSSPlanQuery,
    stripResourceQuery,
    toResolvedMasterCSSPlanId,
    type CSSPlanModuleResult
} from './plan-module'

type MaybePromise<T> = T | Promise<T>

export interface MasterCSSPlanLoaderPluginContext {
    addWatchFile?: (id: string) => void
}

export interface MasterCSSPlanLoaderPluginOptions {
    cwd?: string
    resolveUnresolved?: boolean
    loadPlanModule: (path: string) => MaybePromise<CSSPlanModuleResult>
    onLoadPlanModule?: (payload: {
        planPath: string
        result: CSSPlanModuleResult
        pluginContext: MasterCSSPlanLoaderPluginContext
    }) => void
}

export function createMasterCSSPlanLoaderPlugin(options: MasterCSSPlanLoaderPluginOptions) {
    return {
        name: 'master-css:plan-loader',
        enforce: 'pre' as const,
        async resolveId(
            this: { resolve?: (id: string, importer?: string, options?: { skipSelf?: boolean }) => Promise<{ id: string } | null | undefined> },
            id: string,
            importer?: string
        ) {
            if (!isMasterCSSPlanRequest(id)) return
            const sourceId = stripMasterCSSPlanQuery(id)
            const resolved = await this.resolve?.(sourceId, importer, { skipSelf: true })
            if (resolved) return toResolvedMasterCSSPlanId(resolved.id)
            if (options.resolveUnresolved === false) return
            const baseDir = importer
                ? dirname(stripResourceQuery(importer))
                : options.cwd || process.cwd()
            const file = isAbsolute(sourceId) ? sourceId : resolve(baseDir, sourceId)
            return toResolvedMasterCSSPlanId(file)
        },
        async load(this: MasterCSSPlanLoaderPluginContext, id: string) {
            const planPath = fromResolvedMasterCSSPlanId(id)
            if (!planPath) return
            const result = await options.loadPlanModule(planPath)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }
            options.onLoadPlanModule?.({
                planPath,
                result,
                pluginContext: this
            })
            return result.code
        }
    }
}
