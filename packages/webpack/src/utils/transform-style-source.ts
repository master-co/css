import {
    compileStyleCSS,
    createStyleEntryEmittedGlobals,
    createStyleCSSHostSource,
    hasLocalStyleDirectives,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    transformLocalStyleCSS
} from '@master/css-stylesheet'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { loadProjectManifest } from '@master/css-project/manifest'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'

interface TransformStyleSourceOptions {
    projectDir?: string
    masterImport?: string
}

function hasMasterStyleManifestDirective(source: string) {
    return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
}

async function createGlobalStyleEntryEmittedGlobals(
    entries: string[],
    baseManifest: Awaited<ReturnType<typeof loadProjectManifest>>['manifest'],
    projectDir: string | undefined,
    dependencies: string[]
) {
    if (!entries.length) return
    const result = await createStyleEntryEmittedGlobals(entries, {
        baseManifest,
        projectDir
    })
    dependencies.push(...result.dependencies)
    return result.emittedGlobals
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
            const entries = await findCSSManifestEntryFiles(projectDir)
            const projectManifest = await loadProjectManifest(projectDir, { entries })
            const emittedGlobals = await createGlobalStyleEntryEmittedGlobals(
                entries,
                projectManifest.manifest,
                projectDir,
                dependencies
            )
            const result = await transformLocalStyleCSS(resourcePath, source, {
                baseManifest: projectManifest.manifest,
                projectDir,
                emittedGlobals
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
