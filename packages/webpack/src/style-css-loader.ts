import { dirname, relative } from 'node:path'
import { transformStyleSource } from './utils/transform-style-source'

interface StyleCSSLoaderOptions {
    virtualCSSImportModuleId?: string
}

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    async?: () => (error: Error | null, result?: string) => void
    addDependency?: (file: string) => void
    getOptions?: () => StyleCSSLoaderOptions
}

function toCSSImportPath(fromFile: string, toFile?: string) {
    if (!toFile) return undefined
    let importPath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
    if (!importPath.startsWith('.')) {
        importPath = './' + importPath
    }
    return importPath
}

export default function masterCSSStyleCSSLoader(this: LoaderContext, source: string) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.webpack] Style CSS loader requires an async loader context.')
    }
    const options = this.getOptions?.() || {}
    transformStyleSource(this.resourcePath, source, {
        projectDir: this.rootContext,
        masterImport: toCSSImportPath(this.resourcePath, options.virtualCSSImportModuleId)
    })
        .then((result) => {
            for (const dependency of new Set(result.dependencies)) {
                this.addDependency?.(dependency)
            }
            callback(null, result.code)
        })
        .catch((error: Error) => callback(error))
}
