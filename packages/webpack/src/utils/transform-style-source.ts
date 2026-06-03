import {
    compileStyleCSS,
    createStyleCSSHostSource,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource
} from '@master/css-extractor/style'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'

interface TransformStyleSourceOptions {
    projectDir?: string
    masterImport?: string
}

export async function transformStyleSource(
    resourcePath: string,
    source: string,
    options: TransformStyleSourceOptions = {}
) {
    const { projectDir, masterImport = VIRTUAL_CSS_ID } = options
    const dependencies: string[] = []
    if (!isStyleCSSRequest(resourcePath)) {
        return { code: source, dependencies }
    }
    if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) {
        const cleanSource = removeMasterStyleDirectives(source).code
        if (!cleanSource.includes('@master')) {
            return {
                code: cleanSource,
                dependencies
            }
        }
        const result = await compileStyleCSS(resourcePath, cleanSource, {
            projectDir,
            preserveNativeCSS: true
        })
        return {
            code: result.nativeCSS || result.css || '',
            dependencies: result.dependencies || dependencies
        }
    }

    const resolvedSource = resolveMasterStyleSource(resourcePath, source, projectDir)
    if (!resolvedSource) {
        return { code: source, dependencies }
    }

    dependencies.push(...resolvedSource.dependencies)
    return {
        code: createStyleCSSHostSource(source, {
            masterImport
        }),
        dependencies
    }
}
