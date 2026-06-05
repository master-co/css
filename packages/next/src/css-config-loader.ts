import { loadConfigModuleSync } from '@master/css-configer/load-sync'
import { loadProjectConfig } from '@master/css-configer/load'
import { toConfigModule } from '@master/css-integration/config-module'
import { isCSSConfigRequest } from '@master/css-configer/css'
import type { Config } from '@master/css'
import { getRegisteredOptions } from './options'

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    addDependency?: (file: string) => void
    async?: () => (error: Error | null, result?: string) => void
    getOptions?: () => MasterCSSConfigLoaderOptions
}

interface MasterCSSConfigLoaderOptions {
    virtual?: boolean
    config?: Config
}

function getConfig(options?: MasterCSSConfigLoaderOptions) {
    return options?.config ?? getRegisteredOptions()?.config
}

async function loadVirtualConfigModule(context: LoaderContext, config?: Config) {
    const projectDir = context.rootContext || process.cwd()
    const result = await loadProjectConfig(projectDir, {
        config
    })
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return toConfigModule(result.config)
}

function loadCSSConfigModule(context: LoaderContext) {
    const resourcePath = context.resourcePath
    if (!isCSSConfigRequest(resourcePath)) {
        throw new TypeError('Master CSS config queries only support CSS entry files.')
    }
    const result = loadConfigModuleSync(resourcePath)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return result.code
}

export default function masterCSSConfigLoader(this: LoaderContext) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.next] CSS config loader requires an async loader context.')
    }
    const options = this.getOptions?.() || {}
    const result = options.virtual
        ? loadVirtualConfigModule(this, getConfig(options))
        : Promise.resolve(loadCSSConfigModule(this))
    result
        .then((code) => callback(null, code))
        .catch((error: Error) => callback(error))
}
