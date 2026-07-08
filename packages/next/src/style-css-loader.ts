import {
    compileRenderedStyleCSS,
    compileStyleCSS,
    hasLocalStyleDirectives,
    isMasterCSSPackageStyleFile,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    transformLocalStyleCSS,
    collectStyleCSSDependencies
} from '@master/css-stylesheet'
import { loadProjectManifest } from '@master/css-project/manifest'
import { hasMasterCSSImport } from '@master/css-lexer'

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    async?: () => (error: Error | null, result?: string) => void
    addDependency?: (file: string) => void
}

function hasMasterStyleDirective(source: string) {
    return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
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

async function transformStyleSource(resourcePath: string, source: string, projectDir?: string) {
    const dependencies: string[] = []
    let code = source

    const resolvedSource = resolveMasterStyleSource(resourcePath, source, projectDir)
    if (resolvedSource) {
        const renderedSource = hasMasterCSSImport(source)
            ? resolvedSource
            : resolveMasterStyleSource(resourcePath, `@import "@master/css";\n${source}`, projectDir) || resolvedSource
        dependencies.push(...renderedSource.dependencies)
        const result = await compileRenderedStyleCSS(resourcePath, renderedSource.source, {
            projectDir,
            preserveNativeCSS: true
        })
        dependencies.push(...(result.dependencies || []))
        return {
            code: result.css || result.nativeCSS || '',
            dependencies
        }
    }

    if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) {
        code = removeMasterStyleDirectives(code).code
        if (!hasMasterStyleDirective(code)) {
            return { code, dependencies }
        }
        const result = await compileStyleCSS(resourcePath, code, {
            projectDir,
            preserveNativeCSS: true
        })
        dependencies.push(...(result.dependencies || []))
        return {
            code: result.css || result.nativeCSS || '',
            dependencies
        }
    }

    if (!resolvedSource) {
        if (hasLocalStyleDirectives(source)) {
            const projectManifest = await loadProjectManifest(projectDir)
            const result = await transformLocalStyleCSS(resourcePath, source, {
                baseManifest: projectManifest.manifest,
                projectDir
            })
            dependencies.push(...projectManifest.dependencies, ...(result.dependencies || []))
            return {
                code: result.code,
                dependencies
            }
        }
        return { code, dependencies }
    }

    const result = await compileStyleCSS(resourcePath, code, {
        projectDir,
        preserveNativeCSS: true
    })
    dependencies.push(...(result.dependencies || []))
    return {
        code: result.css || result.nativeCSS || '',
        dependencies
    }
}

export default function masterCSSStyleCSSLoader(this: LoaderContext, source: string) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.next] Style CSS loader requires an async loader context.')
    }
    const dependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
        ? new Set(collectStyleCSSDependencies(this.resourcePath, source, this.rootContext))
        : new Set<string>()
    for (const dependency of dependencies) {
        this.addDependency?.(dependency)
    }
    transformStyleSource(this.resourcePath, source, this.rootContext)
        .then((result) => {
            for (const dependency of new Set(result.dependencies)) {
                if (dependencies.has(dependency)) continue
                this.addDependency?.(dependency)
            }
            callback(null, result.code)
        })
        .catch((error: Error) => callback(error))
}
