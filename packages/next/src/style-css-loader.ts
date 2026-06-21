import {
    compileStyleCSS,
    createMasterCSSPackageHostSource,
    createStyleCSSHostSource,
    hasLocalStyleDirectives,
    isMasterCSSPackageStyleFile,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    transformLocalStyleCSS
} from '@master/css-stylesheet'
import { loadProjectManifest } from '@master/css-manifest/load'

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    async?: () => (error: Error | null, result?: string) => void
    addDependency?: (file: string) => void
}

function hasMasterStyleDirective(source: string) {
    return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
}

async function transformStyleSource(resourcePath: string, source: string, projectDir?: string) {
    const dependencies: string[] = []
    let code = source

    const resolvedSource = resolveMasterStyleSource(resourcePath, source, projectDir)
    if (resolvedSource) {
        dependencies.push(...resolvedSource.dependencies)
        const masterHostSource = await createMasterCSSPackageHostSource(projectDir, { projectDir })
        dependencies.push(...masterHostSource.dependencies)
        code = createStyleCSSHostSource(source, { masterSource: masterHostSource.source })
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
    transformStyleSource(this.resourcePath, source, this.rootContext)
        .then((result) => {
            for (const dependency of new Set(result.dependencies)) {
                this.addDependency?.(dependency)
            }
            callback(null, result.code)
        })
        .catch((error: Error) => callback(error))
}
