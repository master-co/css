import {
  compileRenderedStylesheet,
  compileStylesheet,
  collectStylesheetEmittedGlobals,
  transformStylesheet
} from '@master/css-compiler/stylesheet'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import {
  collectStylesheetDependenciesSync,
  inspectCSSSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'
import { defaultBuildManifest } from '@master/css-build-internal/project'

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  async?: () => (error: Error | null, result?: string) => void
  addDependency?: (file: string) => void
}

function hasMasterStyleDirective(source: string) {
  return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
}

function shouldAddStyleDependencies(resourcePath: string, source: string, projectDir?: string) {
  try {
    const resolution = resolveStylesheetSync(resourcePath, source, { projectDir })
    return Boolean(resolution && resolution.kind !== 'plain')
  } catch {
    return true
  }
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

async function transformStyleSource(resourcePath: string, source: string, projectDir?: string) {
  const dependencies: string[] = []
  const resolution = resolveStylesheetSync(resourcePath, source, { projectDir })
  if (!resolution) return { code: source, dependencies }
  if (resolution.kind === 'entry' || resolution.kind === 'master-package-entry') {
    const renderedSource = inspectCSSSync(source).hasMasterCSSImport
      ? resolution
      : resolveStylesheetSync(
        resourcePath,
        `@import "@master/css";\n${source}`,
        { projectDir }
      ) ?? resolution
    dependencies.push(...renderedSource.dependencies)
    const result = await compileRenderedStylesheet(resourcePath, renderedSource.compilationSource, {
      baseManifest: defaultBuildManifest,
      projectDir,
      preserveNativeCSS: true
    })
    dependencies.push(...(result.dependencies || []))
    return {
      code: result.css || result.nativeCSS || '',
      dependencies
    }
  }

  if (resolution.kind === 'master-package') {
    const code = resolution.outputSource
    if (!hasMasterStyleDirective(code)) {
      return { code, dependencies }
    }
    const result = await compileStylesheet(resourcePath, code, {
      baseManifest: defaultBuildManifest,
      projectDir,
      preserveNativeCSS: true
    })
    dependencies.push(...(result.dependencies || []))
    return {
      code: result.css || result.nativeCSS || '',
      dependencies
    }
  }

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
      dependencies.push(...projectManifest.dependencies, ...(result.dependencies || []))
      return {
        code: result.code,
        dependencies
      }
  }
  if (resolution.kind === 'plain') {
    return { code: source, dependencies }
  }

  return { code: source, dependencies }
}

export default function masterCSSStylesheetLoader(this: LoaderContext, source: string) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css-next] Stylesheet loader requires an async loader context.')
  }
  const dependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
    ? new Set(collectStylesheetDependenciesSync(this.resourcePath, source, {
      projectDir: this.rootContext
    }))
    : new Set<string>()
  for (const dependency of dependencies) {
    this.addDependency?.(dependency)
  }
  transformStyleSource(this.resourcePath, source, this.rootContext)
    .then((result) => {
      for (const dependency of new Set(result.dependencies)) {
        if (dependencies.has(dependency)) continue
        this.addDependency?.(dependency)
      }
      callback(null, result.code)
    })
    .catch((error: Error) => callback(error))
}
