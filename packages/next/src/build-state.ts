import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-build-internal/project'
import {
  createExtractedCSS,
  registerStylesheetSource,
  type StylesheetSources
} from '@master/css-compiler/stylesheet'
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
  const result = await loadProjectManifest({
    root: projectDir,
    baseManifest: defaultBuildManifest
  })
  const scanner = new MasterCSSScanner({
    manifest: result.manifest
  }, projectDir)
  const stylesheetSources: StylesheetSources = new Map()
  try {
    await scanner.init()
    for (const entry of await discoverManifestEntries({ root: projectDir })) {
      await registerStylesheetSource(scanner, stylesheetSources, entry, await readFile(entry, 'utf8'), {
        baseManifest: result.manifest,
        projectDir
      })
    }
  } catch (error) {
    await scanner.dispose()
    throw error
  }

  return {
    async resolve(classes?: string[]) {
      const nativeCSS = classes?.length
        ? await createExtractedCSS({
          scanner,
          stylesheetSources,
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
          ...Array.from(stylesheetSources.values()).flatMap((source) => source.dependencies)
        ])],
        styleSources: Array.from(stylesheetSources.keys())
      }
    },
    async destroy() {
      await scanner.dispose()
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
