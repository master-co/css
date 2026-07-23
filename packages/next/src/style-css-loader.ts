import {
  compileRenderedStyleCSS,
  compileStyleCSS,
  createStyleEntryEmittedGlobals,
  hasLocalStyleDirectives,
  isMasterCSSPackageStyleFile,
  removeMasterStyleDirectives,
  resolveMasterStyleSource,
  transformLocalStyleCSS,
  collectStyleCSSDependencies
} from '@master/css-compiler/stylesheet'
import { loadProjectManifest } from '@master/css-compiler/project'
import { findCSSManifestEntryFiles } from '@master/css-compiler/project/entries'
import { inspectCSS } from '@master/css-compiler'

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
  entries: string[],
  baseManifest: Awaited<ReturnType<typeof loadProjectManifest>>['manifest'],
  projectDir: string | undefined,
  dependencies: string[]
) {
  if (!entries.length) return
  const result = await createStyleEntryEmittedGlobals(entries, {
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
    const renderedSource = inspectCSS(source).hasMasterCSSImport
      ? resolvedSource
      : resolveMasterStyleSource(resourcePath, `@import "@master/css";\n${source}`, projectDir) || resolvedSource
    dependencies.push(...renderedSource.dependencies)
    const result = await compileRenderedStyleCSS(resourcePath, renderedSource.source, {
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
    const result = await compileStyleCSS(resourcePath, code, {
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
      const entries = await findCSSManifestEntryFiles(projectDir)
      const projectManifest = await loadProjectManifest(projectDir, { entries })
      const emittedGlobals = await createGlobalStyleEntryEmittedGlobals(
        entries,
        projectManifest.manifest,
        projectDir,
        dependencies
      )
      const result = await transformLocalStyleCSS(resourcePath, source, {
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

  const result = await compileStyleCSS(resourcePath, code, {
    projectDir,
    preserveNativeCSS: true
  })
  dependencies.push(...(result.dependencies || []))
  return {
    code: result.css || result.nativeCSS || '',
    dependencies
  }
}

export default function masterCSSStyleCSSLoader(this: LoaderContext, source: string) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css-next] Style CSS loader requires an async loader context.')
  }
  const dependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
    ? new Set(collectStyleCSSDependencies(this.resourcePath, source, this.rootContext))
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
