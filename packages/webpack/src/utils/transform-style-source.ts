import {
  compileStylesheet,
  collectStylesheetEmittedGlobals,
  transformStylesheet
} from '@master/css-compiler/stylesheet'
import {
  composeStylesheetHostSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'
import { VIRTUAL_CSS_ID } from '@master/css-internal/style-module'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-internal/project'

interface TransformStyleSourceOptions {
  projectDir?: string
  masterImport?: string
}

function hasMasterStyleManifestDirective(source: string) {
  return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
}

async function createGlobalStyleEntryEmittedGlobals(
  entries: readonly string[],
  baseManifest: Awaited<ReturnType<typeof loadProjectManifest>>['manifest'],
  projectDir: string | undefined,
  dependencies: string[]
) {
  if (!entries.length) return
  const result = await collectStylesheetEmittedGlobals(entries, {
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
  const resolution = resolveStylesheetSync(resourcePath, source, { projectDir })
  if (!resolution) {
    return { code: source, dependencies }
  }
  if (resolution.kind === 'master-package' || resolution.kind === 'master-package-entry') {
    const cleanSource = resolution.outputSource
    if (!hasMasterStyleManifestDirective(cleanSource)) {
      return {
        code: cleanSource,
        dependencies
      }
    }
    const result = await compileStylesheet(resourcePath, cleanSource, {
      baseManifest: defaultBuildManifest,
      projectDir,
      preserveNativeCSS: true
    })
    return {
      code: result.css || result.nativeCSS || '',
      dependencies: result.dependencies || dependencies
    }
  }

  if (resolution.kind !== 'entry') {
    if (resolution.kind === 'local') {
      const entries = await discoverManifestEntries({ root: projectDir })
      const projectManifest = await loadProjectManifest({
        root: projectDir,
        entries,
        baseManifest: defaultBuildManifest
      })
      const emittedGlobals = await createGlobalStyleEntryEmittedGlobals(
        entries,
        projectManifest.manifest,
        projectDir,
        dependencies
      )
      const result = await transformStylesheet(resourcePath, source, {
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

  dependencies.push(...resolution.dependencies)
  return {
    code: composeStylesheetHostSync(source, {
      masterImport
    }),
    dependencies
  }
}
