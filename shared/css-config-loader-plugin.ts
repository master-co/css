import { dirname, isAbsolute, resolve } from 'node:path'
import {
    fromResolvedMasterCSSConfigId,
    isMasterCSSConfigRequest,
    stripMasterCSSConfigQuery,
    stripResourceQuery,
    toResolvedMasterCSSConfigId,
    type CSSConfigModuleResult
} from './css-config-module.js'

type MaybePromise<T> = T | Promise<T>

export interface MasterCSSConfigLoaderPluginContext {
    addWatchFile?: (id: string) => void
}

export interface MasterCSSConfigLoaderPluginOptions {
    cwd?: string
    resolveUnresolved?: boolean
    loadConfigModule: (path: string) => MaybePromise<CSSConfigModuleResult>
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
            if (!isMasterCSSConfigRequest(id)) return
            const sourceId = stripMasterCSSConfigQuery(id)
            const resolved = await this.resolve?.(sourceId, importer, { skipSelf: true })
            if (resolved) return toResolvedMasterCSSConfigId(resolved.id)
            if (options.resolveUnresolved === false) return
            const baseDir = importer
                ? dirname(stripResourceQuery(importer))
                : options.cwd || process.cwd()
            const file = isAbsolute(sourceId) ? sourceId : resolve(baseDir, sourceId)
            return toResolvedMasterCSSConfigId(file)
        },
        async load(this: MasterCSSConfigLoaderPluginContext, id: string) {
            const configPath = fromResolvedMasterCSSConfigId(id)
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
