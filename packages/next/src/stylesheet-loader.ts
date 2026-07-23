import {
  compileRenderedStylesheet,
  compileStylesheet,
  createStyleEntryEmittedGlobals,
  hasLocalStyleDirectives,
  isMasterCSSPackageStyleFile,
  removeMasterStyleDirectives,
  resolveMasterStyleSource,
  transformLocalStylesheet,
  collectStylesheetDependencies
} from '@master/css-compiler/stylesheet'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { inspectCSSSync } from '@master/css-compiler/node'
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
  if (hasLocalStyleDirectives(source)) return true
  if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) return true
  try {
    return Boolean(resolveMasterStyleSource(resourcePath, source, projectDir))
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
  const result = await createStyleEntryEmittedGlobals([...entries], {
    baseManifest,
    projectDir
  })
  dependencies.push(...result.dependencies)
  return result.emittedGlobals
}

async function transformStyleSource(resourcePath: string, source: string, projectDir?: string) {
  const dependencies: string[] = []
  let code = source

  const resolvedSource = resolveMasterStyleSource(resourcePath, source, projectDir)
  if (resolvedSource) {
    const renderedSource = inspectCSSSync(source).hasMasterCSSImport
      ? resolvedSource
      : resolveMasterStyleSource(resourcePath, `@import "@master/css";\n${source}`, projectDir) || resolvedSource
    dependencies.push(...renderedSource.dependencies)
    const result = await compileRenderedStylesheet(resourcePath, renderedSource.source, {
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

  if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) {
    code = removeMasterStyleDirectives(code).code
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
      dependencies.push(...projectManifest.dependencies, ...(result.dependencies || []))
      return {
        code: result.code,
        dependencies
      }
    }
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

export default function masterCSSStylesheetLoader(this: LoaderContext, source: string) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css-next] Stylesheet loader requires an async loader context.')
  }
  const dependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
    ? new Set(collectStylesheetDependencies(this.resourcePath, source, this.rootContext))
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
