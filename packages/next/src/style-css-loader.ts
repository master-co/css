import {
    compileStyleCSS,
    createMasterCSSPackageHostSource,
    createStyleCSSHostSource,
    hasStyleCSSImport,
    isMasterCSSPackageStyleFile,
    removeMasterStyleDirectives
} from '@master/css-extractor/style'

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    async?: () => (error: Error | null, result?: string) => void
    addDependency?: (file: string) => void
}

async function transformStyleSource(resourcePath: string, source: string, projectDir?: string) {
    const dependencies: string[] = []
    let code = source

    if (hasStyleCSSImport(source)) {
        const masterHostSource = await createMasterCSSPackageHostSource(projectDir, { projectDir })
        dependencies.push(...masterHostSource.dependencies)
        code = createStyleCSSHostSource(source, { masterSource: masterHostSource.source })
    }

    if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) {
        code = removeMasterStyleDirectives(code).code
    }

    if (!/@master\b/.test(code)) return { code, dependencies }

    const result = await compileStyleCSS(resourcePath, code, {
        projectDir,
        preserveNativeCSS: true
    })
    dependencies.push(...(result.dependencies || []))
    return {
        code: result.nativeCSS || result.css || '',
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
