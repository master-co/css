import { loadConfigModuleSync } from '@master/css-configer/load-sync'
import createConfigFromCSSDirectives from '@master/css/create-config-from-css-directives'

interface LoaderContext {
    resourcePath: string
    addDependency?: (file: string) => void
}

export default function masterCSSConfigLoader(this: LoaderContext) {
    const result = loadConfigModuleSync(this.resourcePath, {
        createConfigFromCSSDirectives
    })
    for (const dependency of result.dependencies) {
        this.addDependency?.(dependency)
    }
    return result.code
}
