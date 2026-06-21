import CSSExtractor from '@master/css-extractor'
import { loadProjectPlan } from '@master/css-plan/load'
import { findCSSPlanEntryFiles } from '@master/css-plan/css'
import {
    createExtractedCSS,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import type { MasterCSSPlan } from '@master/css'
import { readFile } from 'node:fs/promises'

export interface MasterCSSBuildPlan {
    plan: MasterCSSPlan
    nativeCSS: string
    dependencies: string[]
    styleSources: string[]
}

export interface MasterCSSBuildPlanResolver {
    resolve: (classes?: string[]) => Promise<MasterCSSBuildPlan>
}

export async function createMasterCSSBuildPlanResolver(projectDir: string): Promise<MasterCSSBuildPlanResolver> {
    const result = await loadProjectPlan(projectDir)
    const extractor = new CSSExtractor({
        include: [],
        plan: result.plan
    }, projectDir)
    const styleCSSSources: StyleCSSSources = new Map()
    await extractor.init()
    for (const entry of await findCSSPlanEntryFiles(projectDir)) {
        await registerStyleCSSSource(extractor, styleCSSSources, entry, await readFile(entry, 'utf8'), {
            basePlan: result.plan,
            projectDir
        })
    }

    return {
        async resolve(classes?: string[]) {
            const nativeCSS = classes?.length
                ? await createExtractedCSS({
                    state: extractor,
                    styleCSSSources,
                    basePlan: result.plan,
                    plan: result.plan,
                    projectDir,
                    classes,
                    includeGeneratedCSS: false
                })
                : ''

            return {
                plan: result.plan,
                nativeCSS,
                dependencies: [...new Set([
                    ...result.dependencies,
                    ...Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
                ])],
                styleSources: Array.from(styleCSSSources.keys())
            }
        }
    }
}

export async function resolveMasterCSSBuildPlan(
    projectDir: string,
    classes?: string[]
): Promise<MasterCSSBuildPlan> {
    const resolver = await createMasterCSSBuildPlanResolver(projectDir)
    return resolver.resolve(classes)
}
