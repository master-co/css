import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { loadManifestJSONSync } from '@master/css-project/manifest-sync'
import { loadProjectManifestJSON } from '@master/css-project/manifest'
import { isCSSManifestRequest } from '@master/css-project/entries'
import { toHashedManifestAssetFileName } from '@master/css-integration/node'
import {
    toInlineManifestModule,
    toUniversalManifestFacadeModule
} from '@master/css-integration/manifest-facade'

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    addDependency?: (file: string) => void
    async?: () => (error: Error | null, result?: string) => void
    getOptions?: () => MasterCSSManifestLoaderOptions
}

interface MasterCSSManifestLoaderOptions {
    virtual?: boolean
    module?: boolean
    external?: boolean
}

function writeExternalManifestAssets(projectDir: string, json: string) {
    const assetFileName = toHashedManifestAssetFileName(json)
    const assetPaths = [
        resolve(projectDir, '.next', 'static', 'media', assetFileName),
        resolve(projectDir, '.next', 'dev', 'static', 'media', assetFileName)
    ]
    for (const assetPath of assetPaths) {
        mkdirSync(dirname(assetPath), { recursive: true })
        writeFileSync(assetPath, json)
    }
    return assetFileName
}

function toLoaderResult(context: LoaderContext, json: string, options: MasterCSSManifestLoaderOptions) {
    if (!options.module) return json
    if (!options.external) return toInlineManifestModule(json)

    const projectDir = context.rootContext || process.cwd()
    const assetFileName = writeExternalManifestAssets(projectDir, json)

    return toUniversalManifestFacadeModule(
        JSON.stringify(`/_next/static/media/${assetFileName}`)
    )
}

async function loadVirtualManifestJSON(context: LoaderContext) {
    const projectDir = context.rootContext || process.cwd()
    const result = await loadProjectManifestJSON(projectDir)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.json
}

function loadCSSManifestJSON(context: LoaderContext) {
    const resourcePath = context.resourcePath
    if (!isCSSManifestRequest(resourcePath)) {
        throw new TypeError('Master CSS manifest queries only support CSS entry files.')
    }
    const result = loadManifestJSONSync(resourcePath)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.json
}

export default function masterCSSManifestLoader(this: LoaderContext) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.next] CSS manifest loader requires an async loader context.')
    }
    const options = this.getOptions?.() || {}
    const result = options.virtual
        ? loadVirtualManifestJSON(this)
        : Promise.resolve(loadCSSManifestJSON(this))
    result
        .then((json) => callback(null, toLoaderResult(this, json, options)))
        .catch((error: Error) => callback(error))
}
