import { dirname, isAbsolute, resolve } from 'node:path'
import {
    fromResolvedMasterCSSConfigId,
    isMasterCSSConfigRequest,
    stripMasterCSSConfigQuery,
    stripResourceQuery,
    toResolvedMasterCSSConfigId,
    type CSSConfigModuleResult
} from './config-module'
import {
    fromResolvedMasterCSSPlanId,
    isMasterCSSPlanRequest,
    stripMasterCSSPlanQuery,
    toPlanModule,
    toResolvedMasterCSSPlanId,
    type CSSPlanModuleResult
} from './plan-module'

type MaybePromise<T> = T | Promise<T>

export interface MasterCSSConfigLoaderPluginContext {
    addWatchFile?: (id: string) => void
}

export interface MasterCSSConfigLoaderPluginOptions {
    cwd?: string
    resolveUnresolved?: boolean
    loadConfigModule: (path: string) => MaybePromise<CSSConfigModuleResult>
    loadPlanModule?: (path: string) => MaybePromise<CSSPlanModuleResult>
    onLoadConfigModule?: (payload: {
        configPath: string
        result: CSSConfigModuleResult
        pluginContext: MasterCSSConfigLoaderPluginContext
    }) => void
}

export function createMasterCSSConfigLoaderPlugin(options: MasterCSSConfigLoaderPluginOptions) {
    return {
        name: 'master-css:config-loader',
        enforce: 'pre' as const,
        async resolveId(
            this: { resolve?: (id: string, importer?: string, options?: { skipSelf?: boolean }) => Promise<{ id: string } | null | undefined> },
            id: string,
            importer?: string
        ) {
            const isConfigRequest = isMasterCSSConfigRequest(id)
            const isPlanRequest = isMasterCSSPlanRequest(id)
            if (!isConfigRequest && !isPlanRequest) return
            const sourceId = isPlanRequest
                ? stripMasterCSSPlanQuery(id)
                : stripMasterCSSConfigQuery(id)
            const resolved = await this.resolve?.(sourceId, importer, { skipSelf: true })
            if (resolved) return isPlanRequest
                ? toResolvedMasterCSSPlanId(resolved.id)
                : toResolvedMasterCSSConfigId(resolved.id)
            if (options.resolveUnresolved === false) return
            const baseDir = importer
                ? dirname(stripResourceQuery(importer))
                : options.cwd || process.cwd()
            const file = isAbsolute(sourceId) ? sourceId : resolve(baseDir, sourceId)
            return isPlanRequest
                ? toResolvedMasterCSSPlanId(file)
                : toResolvedMasterCSSConfigId(file)
        },
        async load(this: MasterCSSConfigLoaderPluginContext, id: string) {
            const configPath = fromResolvedMasterCSSConfigId(id)
            const planPath = fromResolvedMasterCSSPlanId(id)
            if (planPath) {
                const result = options.loadPlanModule
                    ? await options.loadPlanModule(planPath)
                    : await options.loadConfigModule(planPath)
                for (const dependency of result.dependencies) {
                    this.addWatchFile?.(dependency)
                }
                options.onLoadConfigModule?.({
                    configPath: planPath,
                    result: result as CSSConfigModuleResult,
                    pluginContext: this
                })
                return options.loadPlanModule
                    ? (result as CSSPlanModuleResult).code
                    : toPlanModule(result.plan!)
            }
            if (!configPath) return
            const result = await options.loadConfigModule(configPath)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }
            options.onLoadConfigModule?.({
                configPath,
                result,
                pluginContext: this
            })
            return result.code
        }
    }
}
