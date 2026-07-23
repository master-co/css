import {
  compileStylesheet,
  createStyleEntryEmittedGlobals,
  createStylesheetHostSource,
  hasLocalStyleDirectives,
  isMasterCSSPackageStyleFile,
  isStylesheetRequest,
  removeMasterStyleDirectives,
  resolveMasterStyleSource,
  transformLocalStylesheet
} from '@master/css-compiler/stylesheet'
import { VIRTUAL_CSS_ID } from '@master/css-build-internal/style-module'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-build-internal/project'

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
  const result = await createStyleEntryEmittedGlobals([...entries], {
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
  if (!isStylesheetRequest(resourcePath)) {
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

  const resolvedSource = resolveMasterStyleSource(resourcePath, source, projectDir)
  if (!resolvedSource) {
    if (hasLocalStyleDirectives(source)) {
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
      const result = await transformLocalStylesheet(resourcePath, source, {
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
    code: createStylesheetHostSource(source, {
      masterImport
    }),
    dependencies
  }
}
