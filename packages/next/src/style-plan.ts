import CSSExtractor from '@master/css-extractor'
import { loadProjectPlan } from '@master/css-configer/load'
import { findCSSPlanEntryFiles } from '@master/css-configer/css'
import {
    createExtractedCSS,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-extractor/style'
import type { MasterCSSPlan } from '@master/css'
import { readFile } from 'node:fs/promises'

export interface MasterCSSBuildPlan {
    plan: MasterCSSPlan
    nativeCSS: string
    dependencies: string[]
    styleSources: string[]
}

export async function resolveMasterCSSBuildPlan(
    projectDir: string,
    classes?: string[]
): Promise<MasterCSSBuildPlan> {
    const result = await loadProjectPlan(projectDir)
    const extractor = new CSSExtractor({
        include: [],
        plan: result.plan
    }, projectDir)
    const styleCSSSources: StyleCSSSources = new Map()
    await extractor.init()
    for (const entry of await findCSSPlanEntryFiles(projectDir)) {
        await registerStyleCSSSource(extractor, styleCSSSources, entry, await readFile(entry, 'utf8'), {
            projectDir
        })
    }
    const nativeCSS = classes?.length
        ? await createExtractedCSS({
            extractor,
            styleCSSSources,
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
