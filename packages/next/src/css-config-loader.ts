import { loadConfigSync } from '@master/css-explore-config/sync'

interface LoaderContext {
    resourcePath: string
    addDependency?: (file: string) => void
}

export default function masterCSSConfigLoader(this: LoaderContext) {
    const result = loadConfigSync(this.resourcePath)
    for (const dependency of result.dependencies) {
        this.addDependency?.(dependency)
    }
    return `export default ${JSON.stringify(result.config)};`
}
