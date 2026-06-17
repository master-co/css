import { dirname, isAbsolute, resolve } from 'node:path'
import {
    fromResolvedMasterCSSPlanId,
    isMasterCSSPlanRequest,
    stripMasterCSSPlanQuery,
    stripResourceQuery,
    toResolvedMasterCSSPlanId,
    type CSSPlanJSONResult
} from './plan-module'
import { toInlinePlanModule } from './plan-facade'

type MaybePromise<T> = T | Promise<T>

export interface MasterCSSPlanLoaderPluginContext {
    addWatchFile?: (id: string) => void
    emitFile?: (asset: { type: 'asset', name: string, source: string }) => string
}

export interface MasterCSSPlanLoaderPluginOptions {
    cwd?: string
    resolveUnresolved?: boolean
    loadPlanJSON: (path: string) => MaybePromise<CSSPlanJSONResult>
    toPlanModule?: (payload: {
        planPath: string
        result: CSSPlanJSONResult
        pluginContext: MasterCSSPlanLoaderPluginContext
    }) => MaybePromise<string>
    onLoadPlanJSON?: (payload: {
        planPath: string
        result: CSSPlanJSONResult
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
            const result = await options.loadPlanJSON(planPath)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }
            options.onLoadPlanJSON?.({
                planPath,
                result,
                pluginContext: this
            })
            return options.toPlanModule
                ? options.toPlanModule({ planPath, result, pluginContext: this })
                : toInlinePlanModule(result.json)
        }
    }
}
