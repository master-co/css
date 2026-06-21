import CSSExtractor from '@master/css-extractor'
import { loadProjectManifest } from '@master/css-manifest/load'
import { findCSSManifestEntryFiles } from '@master/css-manifest/css'
import {
    createExtractedCSS,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import type { MasterCSSManifest } from '@master/css'
import { readFile } from 'node:fs/promises'

export interface MasterCSSBuildState {
    manifest: MasterCSSManifest
    nativeCSS: string
    dependencies: string[]
    styleSources: string[]
}

export interface MasterCSSBuildStateResolver {
    resolve: (classes?: string[]) => Promise<MasterCSSBuildState>
}

export async function createMasterCSSBuildStateResolver(projectDir: string): Promise<MasterCSSBuildStateResolver> {
    const result = await loadProjectManifest(projectDir)
    const extractor = new CSSExtractor({
        include: [],
        manifest: result.manifest
    }, projectDir)
    const styleCSSSources: StyleCSSSources = new Map()
    await extractor.init()
    for (const entry of await findCSSManifestEntryFiles(projectDir)) {
        await registerStyleCSSSource(extractor, styleCSSSources, entry, await readFile(entry, 'utf8'), {
            baseManifest: result.manifest,
            projectDir
        })
    }

    return {
        async resolve(classes?: string[]) {
            const nativeCSS = classes?.length
                ? await createExtractedCSS({
                    state: extractor,
                    styleCSSSources,
                    baseManifest: result.manifest,
                    manifest: result.manifest,
                    projectDir,
                    classes,
                    includeGeneratedCSS: false
                })
                : ''

            return {
                manifest: result.manifest,
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

export async function resolveMasterCSSBuildState(
    projectDir: string,
    classes?: string[]
): Promise<MasterCSSBuildState> {
    const resolver = await createMasterCSSBuildStateResolver(projectDir)
    return resolver.resolve(classes)
}
