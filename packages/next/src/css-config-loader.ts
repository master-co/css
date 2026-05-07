import { loadConfigSync } from '@master/css-explore-config/sync'

interface LoaderContext {
    resourcePath: string
    addDependency?: (file: string) => void
}

function stripResourceQuery(resourcePath: string) {
    return resourcePath.replace(/[?#].*$/, '')
}

export default function masterCSSConfigLoader(this: LoaderContext) {
    const configPath = stripResourceQuery(this.resourcePath)
    const result = loadConfigSync(configPath)
    for (const dependency of result.dependencies) {
        this.addDependency?.(dependency)
    }
    return `export default ${JSON.stringify(result.config)};`
}
