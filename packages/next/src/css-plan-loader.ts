import { loadPlanModuleSync } from '@master/css-plan/load-sync'
import { loadProjectPlanModule } from '@master/css-plan/load'
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
}

async function loadVirtualPlanModule(context: LoaderContext) {
    const projectDir = context.rootContext || process.cwd()
    const result = await loadProjectPlanModule(projectDir)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.code
}

function loadCSSPlanModule(context: LoaderContext) {
    const resourcePath = context.resourcePath
    if (!isCSSPlanRequest(resourcePath)) {
        throw new TypeError('Master CSS plan queries only support CSS entry files.')
    }
    const result = loadPlanModuleSync(resourcePath)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.code
}

export default function masterCSSPlanLoader(this: LoaderContext) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.next] CSS plan loader requires an async loader context.')
    }
    const options = this.getOptions?.() || {}
    const result = options.virtual
        ? loadVirtualPlanModule(this)
        : Promise.resolve(loadCSSPlanModule(this))
    result
        .then((code) => callback(null, code))
        .catch((error: Error) => callback(error))
}
