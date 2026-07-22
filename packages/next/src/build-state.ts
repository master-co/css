import CSSScanner from '@master/css-scanner'
import { loadProjectManifest } from '@master/css-project/manifest'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import {
  createExtractedCSS,
  registerStyleCSSSource,
  type StyleCSSSources
} from '@master/css-stylesheet'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { readFile } from 'node:fs/promises'

export interface MasterCSSBuildState {
  manifest: MasterCSSManifest
  nativeCSS: string
  dependencies: string[]
  styleSources: string[]
}

export interface MasterCSSBuildStateResolver {
  resolve: (classes?: string[]) => Promise<MasterCSSBuildState>
  destroy: () => Promise<void>
}

export async function createMasterCSSBuildStateResolver(projectDir: string): Promise<MasterCSSBuildStateResolver> {
  const result = await loadProjectManifest(projectDir)
  const scanner = new CSSScanner({
    manifest: result.manifest
  }, projectDir)
  const styleCSSSources: StyleCSSSources = new Map()
  try {
    await scanner.init()
    for (const entry of await findCSSManifestEntryFiles(projectDir)) {
      await registerStyleCSSSource(scanner, styleCSSSources, entry, await readFile(entry, 'utf8'), {
        baseManifest: result.manifest,
        projectDir
      })
    }
  } catch (error) {
    await scanner.destroy()
    throw error
  }

  return {
    async resolve(classes?: string[]) {
      const nativeCSS = classes?.length
        ? await createExtractedCSS({
          scanner,
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
    },
    async destroy() {
      await scanner.destroy()
    }
  }
}

export async function resolveMasterCSSBuildState(
  projectDir: string,
  classes?: string[]
): Promise<MasterCSSBuildState> {
  const resolver = await createMasterCSSBuildStateResolver(projectDir)
  try {
    return await resolver.resolve(classes)
  } finally {
    await resolver.destroy()
  }
}
