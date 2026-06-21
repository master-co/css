import { dirname, isAbsolute, resolve } from 'node:path'
import {
    isMasterCSSManifestRequest,
    stripMasterCSSManifestQuery,
    stripResourceQuery,
    type CSSManifestJSONResult
} from './manifest-module'
import { toInlineManifestModule } from './manifest-facade'
import {
    fromResolvedMasterCSSManifestId,
    toResolvedMasterCSSManifestId
} from './node'

type MaybePromise<T> = T | Promise<T>

export interface MasterCSSManifestLoaderPluginContext {
    addWatchFile?: (id: string) => void
    emitFile?: (asset: { type: 'asset', name: string, source: string }) => string
}

export interface MasterCSSManifestLoaderPluginOptions {
    cwd?: string
    resolveUnresolved?: boolean
    loadManifestJSON: (path: string) => MaybePromise<CSSManifestJSONResult>
    toManifestModule?: (payload: {
        manifestPath: string
        result: CSSManifestJSONResult
        pluginContext: MasterCSSManifestLoaderPluginContext
    }) => MaybePromise<string>
    onLoadManifestJSON?: (payload: {
        manifestPath: string
        result: CSSManifestJSONResult
        pluginContext: MasterCSSManifestLoaderPluginContext
    }) => void
}

export function createMasterCSSManifestLoaderPlugin(options: MasterCSSManifestLoaderPluginOptions) {
    return {
        name: 'master-css:manifest-loader',
        enforce: 'pre' as const,
        async resolveId(
            this: { resolve?: (id: string, importer?: string, options?: { skipSelf?: boolean }) => Promise<{ id: string } | null | undefined> },
            id: string,
            importer?: string
        ) {
            if (!isMasterCSSManifestRequest(id)) return
            const sourceId = stripMasterCSSManifestQuery(id)
            const resolved = await this.resolve?.(sourceId, importer, { skipSelf: true })
            if (resolved) return toResolvedMasterCSSManifestId(resolved.id)
            if (options.resolveUnresolved === false) return
            const baseDir = importer
                ? dirname(stripResourceQuery(importer))
                : options.cwd || process.cwd()
            const file = isAbsolute(sourceId) ? sourceId : resolve(baseDir, sourceId)
            return toResolvedMasterCSSManifestId(file)
        },
        async load(this: MasterCSSManifestLoaderPluginContext, id: string) {
            const manifestPath = fromResolvedMasterCSSManifestId(id)
            if (!manifestPath) return
            const result = await options.loadManifestJSON(manifestPath)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }
            options.onLoadManifestJSON?.({
                manifestPath,
                result,
                pluginContext: this
            })
            return options.toManifestModule
                ? options.toManifestModule({ manifestPath, result, pluginContext: this })
                : toInlineManifestModule(result.json)
        }
    }
}
