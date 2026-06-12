import {
    compileStyleCSS,
    createStyleCSSHostSource,
    hasLocalStyleDirectives,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    transformLocalStyleCSS
} from '@master/css-extractor/style'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { loadProjectPlan } from '@master/css-configer/load'

interface TransformStyleSourceOptions {
    projectDir?: string
    masterImport?: string
}

function hasMasterStylePlanDirective(source: string) {
    return source.includes('@settings') || source.includes('@theme') || source.includes('@animations') || source.includes('@master')
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
        if (!hasMasterStylePlanDirective(cleanSource)) {
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
            const projectPlan = await loadProjectPlan(projectDir)
            const result = await transformLocalStyleCSS(resourcePath, source, {
                basePlan: projectPlan.plan,
                projectDir
            })
            return {
                code: result.code,
                dependencies: [...new Set([
                    ...projectPlan.dependencies,
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
