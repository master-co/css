import CSSExtractor from '@master/css-extractor'
import { loadProjectConfig } from '@master/css-configer/load'
import { findCSSConfigEntryFiles } from '@master/css-configer/css'
import {
    createExtractedCSS,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-extractor/style'
import type { Config } from '@master/css'
import { readFile } from 'node:fs/promises'

export interface MasterCSSBuildConfig {
    config: Config
    nativeCSS: string
    dependencies: string[]
    styleSources: string[]
}

export async function resolveMasterCSSBuildConfig(
    projectDir: string,
    configOption?: Config,
    classes?: string[]
): Promise<MasterCSSBuildConfig> {
    const extractor = new CSSExtractor({
        include: [],
        config: configOption
    }, projectDir)
    const styleCSSSources: StyleCSSSources = new Map()
    await extractor.init()
    for (const entry of await findCSSConfigEntryFiles(projectDir)) {
        await registerStyleCSSSource(extractor, styleCSSSources, entry, await readFile(entry, 'utf8'), {
            projectDir
        })
    }
    const result = await loadProjectConfig(projectDir, {
        config: configOption
    })
    const nativeCSS = classes?.length
        ? await createExtractedCSS({
            extractor,
            styleCSSSources,
            config: configOption,
            projectDir,
            classes,
            includeGeneratedCSS: false
        })
        : ''

    return {
        config: result.config,
        nativeCSS,
        dependencies: [...new Set([
            ...result.dependencies,
            ...Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
        ])],
        styleSources: Array.from(styleCSSSources.keys())
    }
}
