import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import {
  collectStylesheetEmittedGlobals,
  createStylesheetCollection
} from '@master/css-compiler/stylesheet'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import { readFile } from 'node:fs/promises'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'

const manifestHost = {
  discoverManifestEntries,
  loadProjectManifest,
  collectStylesheetDependencies(entry: string, options: { root?: string }) {
    return collectStylesheetDependenciesSync(entry, undefined, {
      projectDir: options.root
    })
  }
}

export interface MasterCSSBuildState {
  manifest: MasterCSSManifest
  emittedGlobals: MasterCSSEmittedGlobals
  nativeCSS: string
  dependencies: string[]
  styleSources: string[]
}

export interface MasterCSSBuildStateResolver {
  resolve: (classes?: string[]) => Promise<MasterCSSBuildState>
  dispose: () => Promise<void>
}

export async function createMasterCSSBuildStateResolver(projectDir: string): Promise<MasterCSSBuildStateResolver> {
  const result = await loadMasterCSSVirtualManifest({
    host: manifestHost,
    root: projectDir
  })
  const scanner = new MasterCSSScanner({
    manifest: result.manifest
  }, projectDir)
  const stylesheets = createStylesheetCollection()
  let emittedGlobals: MasterCSSEmittedGlobals = {}
  let emittedGlobalsDependencies: readonly string[] = []
  try {
    await scanner.init()
    for (const entry of result.entries) {
      await stylesheets.register(scanner, entry, await readFile(entry, 'utf8'), {
        baseManifest: result.manifest,
        projectDir
      })
    }
    const emittedGlobalsResult = await collectStylesheetEmittedGlobals([...result.entries], {
      baseManifest: result.manifest,
      projectDir
    })
    emittedGlobals = emittedGlobalsResult.emittedGlobals
    emittedGlobalsDependencies = emittedGlobalsResult.dependencies
  } catch (error) {
    await scanner.dispose()
    stylesheets.dispose()
    throw error
  }

  return {
    async resolve(classes?: string[]) {
      const nativeCSS = classes?.length
        ? (await stylesheets.compose({
          scanner,
          baseManifest: result.manifest,
          manifest: result.manifest,
          projectDir,
          classes,
          includeGeneratedCSS: false
        })).css
        : ''

      const stylesheetSnapshot = stylesheets.snapshot()
      return {
        manifest: result.manifest,
        emittedGlobals,
        nativeCSS,
        dependencies: [...new Set([
          ...result.dependencies,
          ...emittedGlobalsDependencies,
          ...stylesheetSnapshot.dependencies
        ])],
        styleSources: [...stylesheetSnapshot.sourceIds]
      }
    },
    async dispose() {
      await scanner.dispose()
      stylesheets.dispose()
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
    await resolver.dispose()
  }
}
