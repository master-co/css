import { addStaticCSSDependencies, transformStaticStyleSource } from './static'
import { prepareNextEntryGraph } from './prepare-entry-graph'
import type { ModuleContext } from './prepare-module'
import { deliverNextStylesheet } from './stylesheet-delivery'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareNextStylesheet, type NextStylesheetLoaderOptions } from './prepare-stylesheet'
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
  resolveStylesheetSync
} from '@master/css-compiler/node'
import { defaultBuildManifest } from '@master/css-internal/project'

interface LoaderContext extends ModuleContext {
  resourcePath: string
  rootContext?: string
  async?: () => (error: Error | null, result?: string, sourceMap?: object, meta?: object) => void
  addDependency?: (file: string) => void
  addContextDependency?: (directory: string) => void
  getOptions?: () => NextStylesheetLoaderOptions
}

function hasMasterStyleDirective(source: string) {
  return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
}

function scopeModuleThemeVariables(code: string, generatedCSS: string | undefined, classNames: readonly string[] | undefined) {
  if (!generatedCSS || !classNames?.length || !code.includes(generatedCSS)) return code
  // Next's CSS Module pipeline requires a local class in every selector.
  // Variables referenced by a module can live on its own classes: descendants
  // inherit them, and mode queries retain the same conditions.
  const localSelector = [...new Set(classNames)].map(name => `.${name.replace(/(^[0-9]|[^a-zA-Z0-9_-])/gu, char => `\\${char.codePointAt(0)!.toString(16)} `)}`).join(',')
  const scoped = generatedCSS
    .replace(/:root\s*,\s*:host(?=\s*\{)|:host\s*,\s*:root(?=\s*\{)/gu, localSelector)
    .replace(/:root(?=\s*\{)|:host(?=\s*\{)/gu, localSelector)
  return code.replace(generatedCSS, scoped)
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

async function transformStyleSource(resourcePath: string, source: string, projectDir: string | undefined, options: NextStylesheetLoaderOptions, onDependency: (file: string) => void, inputMap?: object | string, loaderContext?: LoaderContext) {
  const rawSass = !options.preprocessed && ['.scss', '.sass'].includes(extname(resourcePath))
  const prepared = rawSass ? await prepareNextStylesheet(resourcePath, source, projectDir, options, onDependency) : undefined
  source = prepared?.source ?? source
  const dependencies: string[] = [...prepared?.dependencies ?? []]
  let sourceMap = prepared?.sourceMap ?? (typeof inputMap === 'string' ? inputMap : inputMap ? JSON.stringify(inputMap) : undefined)
  let context = { sourceMap, baseFile: resourcePath, onDependency }
  // Webpack has already run the user's Sass pipeline. Keep its prepared CSS
  // and original filename. Raw Turbopack inputs are prepared before classification.
  const loadSass = () => ({ async compileStringAsync(css: string) { return { css } } })
  // Classify on the import graph; the entry branch below compiles through the
  // delivery path, which accepts import shapes flattening has to refuse.
  const resolution = resolveStylesheetSync(resourcePath, source, { projectDir, preserveImports: true, ...context })
  if (!resolution) return { code: source, dependencies, sourceMap }
  if (options.staticStatePath && resolution.kind === 'entry') {
    await addStaticCSSDependencies(options.staticStatePath, onDependency)
    const code = await transformStaticStyleSource(options.staticStatePath, resourcePath, source)
    await addStaticCSSDependencies(options.staticStatePath, onDependency)
    return { code, dependencies, sourceMap: undefined }
  }
  if (resolution.kind === 'entry' || resolution.kind === 'master-package-entry') {
    const preparedGraph = await prepareNextEntryGraph(loaderContext ?? { resourcePath }, projectDir ?? dirname(resourcePath), options, onDependency, source, sourceMap)
    const { graph, entry: preparedEntry } = preparedGraph
    source = preparedEntry.source
    sourceMap = preparedEntry.sourceMap
    const trackDependency = (file: string) => onDependency(graph.dependencyFile(file))
    context = { ...context, sourceMap, onDependency: trackDependency }
    dependencies.push(...resolution.dependencies)
    const result = await deliverNextStylesheet(resourcePath, projectDir ?? dirname(resourcePath), onDependency, delivery => compileRenderedStylesheet(resourcePath, source, {
      delivery: { ...delivery, resolveImport: graph.resolveImport, onDependency: trackDependency },
      baseManifest: preparedGraph.manifest,
      loadSass,
      ...context,
      projectDir,
      preserveNativeCSS: true
    }))
    dependencies.push(...(result.dependencies || []).map(file => graph.dependencyFile(file)))
    return {
      code: (result.css || result.nativeCSS || '') + (preparedEntry.scoped ? '\n' + preparedEntry.exportsCSS : ''),
      sourceMap: result.sourceMap,
      postcss: preparedGraph.postcss,
      dependencies
    }
  }

  if (resolution.kind === 'master-package') {
    const code = resolution.outputSource
    if (!hasMasterStyleDirective(code)) {
      return { code, dependencies, sourceMap }
    }
    const result = await compileStylesheet(resourcePath, code, {
      baseManifest: defaultBuildManifest,
      loadSass,
      ...context,
      projectDir,
      preserveNativeCSS: true
    })
    dependencies.push(...(result.dependencies || []))
    return {
      code: result.css || result.nativeCSS || '',
      sourceMap: result.sourceMap,
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
        loadSass,
        ...context,
        projectDir,
        emittedGlobals
      })
      dependencies.push(...projectManifest.dependencies, ...(result.dependencies || []))
      return {
        code: /\.module\.(?:css|scss|sass)$/u.test(resourcePath)
          ? scopeModuleThemeVariables(result.code, result.compilation?.generatedCSS, result.compilation?.nativeClassNames)
          : result.code,
        sourceMap: result.sourceMap,
        dependencies
      }
  }
  if (resolution.kind === 'plain') {
    return { code: source, dependencies, sourceMap }
  }

  return { code: source, dependencies, sourceMap }
}

export default function masterCSSStylesheetLoader(this: LoaderContext, source: string, inputMap?: object | string) {
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
  const onDependency = (file: string) => {
    if (dependencies.has(file)) return
    dependencies.add(file)
    this.addDependency?.(file)
  }
  const options = this.getOptions?.() ?? {}
  transformStyleSource(this.resourcePath, source, this.rootContext, options, onDependency, inputMap, this)
    .then((result) => {
      for (const dependency of new Set(result.dependencies)) {
        if (dependencies.has(dependency)) continue
        this.addDependency?.(dependency)
      }
      callback(null, result.code, result.sourceMap ? JSON.parse(result.sourceMap) : undefined, 'postcss' in result && result.postcss ? { masterPostCSSProcessed: true } : undefined)
    })
    .catch((error: Error & { span?: { url?: URL } }) => {
      // Sass does not return loadedUrls when a missing import aborts compilation.
      // Watch its known search directories so creating an input can retry the loader.
      const directories = new Set([dirname(this.resourcePath)])
      if (error.span?.url?.protocol === 'file:') directories.add(dirname(fileURLToPath(error.span.url)))
      for (const paths of [options.sassOptions?.loadPaths, options.sassOptions?.includePaths]) {
        if (Array.isArray(paths)) for (const path of paths) directories.add(resolve(this.rootContext ?? process.cwd(), String(path)))
      }
      for (const directory of directories) this.addContextDependency?.(directory)
      callback(error)
    })
}
