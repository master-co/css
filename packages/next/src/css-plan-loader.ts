import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { loadPlanJSONSync } from '@master/css-plan/load-sync'
import { loadProjectPlanJSON } from '@master/css-plan/load'
import { isCSSPlanRequest } from '@master/css-plan/css'
import { stripResourceQuery } from '@master/css-integration/plan-module'
import { toHashedPlanAssetFileName } from '@master/css-integration/node'
import {
    toInlinePlanModule,
    toUniversalPlanFacadeModule
} from '@master/css-integration/plan-facade'

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    addDependency?: (file: string) => void
    async?: () => (error: Error | null, result?: string) => void
    getOptions?: () => MasterCSSPlanLoaderOptions
}

interface MasterCSSPlanLoaderOptions {
    virtual?: boolean
    module?: boolean
    external?: boolean
}

function toModuleSpecifier(from: string, to: string) {
    const specifier = relative(dirname(from), to).replace(/\\/g, '/')
    return specifier.startsWith('../') ? specifier : `./${specifier}`
}

function toLoaderResult(context: LoaderContext, json: string, options: MasterCSSPlanLoaderOptions) {
    if (!options.module) return json
    if (!options.external) return toInlinePlanModule(json)

    const projectDir = context.rootContext || process.cwd()
    const resourcePath = stripResourceQuery(context.resourcePath)
    const assetFileName = toHashedPlanAssetFileName(json)
    const assetPath = resolve(projectDir, 'node_modules/.master-css', assetFileName)
    mkdirSync(dirname(assetPath), { recursive: true })
    writeFileSync(assetPath, json)

    return toUniversalPlanFacadeModule(
        `new URL(${JSON.stringify(toModuleSpecifier(resourcePath, assetPath))}, import.meta.url)`
    )
}

async function loadVirtualPlanJSON(context: LoaderContext) {
    const projectDir = context.rootContext || process.cwd()
    const result = await loadProjectPlanJSON(projectDir)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.json
}

function loadCSSPlanJSON(context: LoaderContext) {
    const resourcePath = context.resourcePath
    if (!isCSSPlanRequest(resourcePath)) {
        throw new TypeError('Master CSS plan queries only support CSS entry files.')
    }
    const result = loadPlanJSONSync(resourcePath)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.json
}

export default function masterCSSPlanLoader(this: LoaderContext) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.next] CSS plan loader requires an async loader context.')
    }
    const options = this.getOptions?.() || {}
    const result = options.virtual
        ? loadVirtualPlanJSON(this)
        : Promise.resolve(loadCSSPlanJSON(this))
    result
        .then((json) => callback(null, toLoaderResult(this, json, options)))
        .catch((error: Error) => callback(error))
}
