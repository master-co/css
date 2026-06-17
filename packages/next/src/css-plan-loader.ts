import { loadPlanJSONSync } from '@master/css-plan/load-sync'
import { loadProjectPlanJSON } from '@master/css-plan/load'
import { isCSSPlanRequest } from '@master/css-plan/css'

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
}

function toLoaderResult(json: string, asModule?: boolean) {
    return asModule ? `export default ${json}` : json
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
        .then((json) => callback(null, toLoaderResult(json, options.module)))
        .catch((error: Error) => callback(error))
}
