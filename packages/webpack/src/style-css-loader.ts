import { dirname, relative } from 'node:path'
import { transformStyleSource } from './utils/transform-style-source'
import {
    collectStyleCSSDependencies,
    hasLocalStyleDirectives,
    isMasterCSSPackageStyleFile,
    resolveMasterStyleSource
} from '@master/css-stylesheet'

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

function shouldAddStyleDependencies(resourcePath: string, source: string, projectDir?: string) {
    if (hasLocalStyleDirectives(source)) return true
    if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) return true
    try {
        return Boolean(resolveMasterStyleSource(resourcePath, source, projectDir))
    } catch {
        return true
    }
}

export default function masterCSSStyleCSSLoader(this: LoaderContext, source: string) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.webpack] Style CSS loader requires an async loader context.')
    }
    const options = this.getOptions?.() || {}
    const dependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
        ? new Set(collectStyleCSSDependencies(this.resourcePath, source, this.rootContext))
        : new Set<string>()
    for (const dependency of dependencies) {
        this.addDependency?.(dependency)
    }
    transformStyleSource(this.resourcePath, source, {
        projectDir: this.rootContext,
        masterImport: toCSSImportPath(this.resourcePath, options.virtualCSSImportModuleId)
    })
        .then((result) => {
            for (const dependency of new Set(result.dependencies)) {
                if (dependencies.has(dependency)) continue
                this.addDependency?.(dependency)
            }
            callback(null, result.code)
        })
        .catch((error: Error) => callback(error))
}
