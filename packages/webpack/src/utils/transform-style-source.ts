import {
    compileStyleCSS,
    createStyleCSSHostSource,
    hasLocalStyleDirectives,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    transformLocalStyleCSS
} from '@master/css-stylesheet'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { loadProjectManifest } from '@master/css-manifest/load'

interface TransformStyleSourceOptions {
    projectDir?: string
    masterImport?: string
}

function hasMasterStyleManifestDirective(source: string) {
    return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
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
        if (!hasMasterStyleManifestDirective(cleanSource)) {
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
            code: result.css || result.nativeCSS || '',
            dependencies: result.dependencies || dependencies
        }
    }

    const resolvedSource = resolveMasterStyleSource(resourcePath, source, projectDir)
    if (!resolvedSource) {
        if (hasLocalStyleDirectives(source)) {
            const projectManifest = await loadProjectManifest(projectDir)
            const result = await transformLocalStyleCSS(resourcePath, source, {
                baseManifest: projectManifest.manifest,
                projectDir
            })
            return {
                code: result.code,
                dependencies: [...new Set([
                    ...projectManifest.dependencies,
                    ...result.dependencies
                ])]
            }
        }
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
