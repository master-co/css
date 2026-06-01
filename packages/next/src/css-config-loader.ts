import { loadConfigModuleSync } from '@master/css-explore-config/sync'
import { config, createConfigFromCSSDirectives } from '@master/css'

interface LoaderContext {
    resourcePath: string
    addDependency?: (file: string) => void
}

export default function masterCSSConfigLoader(this: LoaderContext) {
    const result = loadConfigModuleSync(this.resourcePath, {
        createConfigFromCSSDirectives,
        baseConfig: config
    })
    for (const dependency of result.dependencies) {
        this.addDependency?.(dependency)
    }
    return result.code
}
