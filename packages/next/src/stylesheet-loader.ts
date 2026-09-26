import { addStaticCSSDependencies, resolveStaticOutputPath, transformStaticStyleSource } from './static'
import { prepareNextEntryGraph } from './prepare-entry-graph'
import { nextGeneratedGlobalAnimations } from './prepare-global-module'
import type { ModuleContext } from './prepare-module'
import { deliverNextStylesheet } from './stylesheet-delivery'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareNextStylesheet, type NextStylesheetLoaderOptions } from './prepare-stylesheet'
import {
  compileRenderedStylesheet,
  compileStylesheet,
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

function shouldAddStyleDependencies(resourcePath: string, source: string, projectDir?: string) {
  try {
    const resolution = resolveStylesheetSync(resourcePath, source, { projectDir })
    return Boolean(resolution && resolution.kind !== 'plain')
  } catch {
    return true
  }
}

async function transformStyleSource(resourcePath: string, source: string, projectDir: string | undefined, options: NextStylesheetLoaderOptions, onDependency: (file: string) => void, inputMap?: object | string, loaderContext?: LoaderContext) {
  if (projectDir && (resourcePath === resolveStaticOutputPath(projectDir) || relative(projectDir, resourcePath).replace(/\\/g, '/').startsWith('.master/stylesheets/'))) {
    return { code: source, dependencies: [], sourceMap: typeof inputMap === 'string' ? inputMap : inputMap ? JSON.stringify(inputMap) : undefined }
  }
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

  if (resolution.kind === 'local' || resolution.kind === 'plain') {
      const moduleStyle = /\.module\.(?:css|scss|sass)$/u.test(resourcePath)
      const entries = await discoverManifestEntries({ root: projectDir })
      loaderContext?.addContextDependency?.(projectDir ?? dirname(resourcePath))
      if (!entries.length && resolution.kind === 'plain') return { code: source, dependencies, sourceMap }
      const projectManifest = await loadProjectManifest({
        root: projectDir,
        entries,
        baseManifest: defaultBuildManifest,
        onDependency
      })
      const result = await transformStylesheet(resourcePath, source, {
        baseManifest: projectManifest.manifest,
        loadSass,
        ...context,
        projectDir,
        referenceFiles: entries,
        transformNativeStylesheets: true,
        generatedGlobals: moduleStyle ? 'separate' : 'inline'
      })
      dependencies.push(...projectManifest.dependencies, ...(result.dependencies || []))
      if (!result.transformed) return { code: source, dependencies, sourceMap }
      if (moduleStyle && result.globalStylesheet && nextGeneratedGlobalAnimations(result.globalStylesheet.css).length) {
        // Managed animation names would be renamed by Next’s final Module pass.
        // Scope and publish that graph once, retaining the public Module exports.
        const preparedGraph = await prepareNextEntryGraph(loaderContext ?? { resourcePath }, projectDir ?? dirname(resourcePath), options, onDependency, source, sourceMap, {
          baseManifest: projectManifest.manifest, referenceFiles: entries
        })
        const { graph, entry } = preparedGraph
        const trackDependency = (file: string) => onDependency(graph.dependencyFile(file))
        const delivered = await deliverNextStylesheet(resourcePath, projectDir ?? dirname(resourcePath), onDependency, delivery => compileRenderedStylesheet(resourcePath, entry.source, {
          baseManifest: preparedGraph.manifest,
          referenceFiles: preparedGraph.postcss ? undefined : entries,
          projectDir, preserveNativeCSS: true, loadSass,
          sourceMap: entry.sourceMap, baseFile: resourcePath, onDependency: trackDependency,
          delivery: { ...delivery, resolveImport: graph.resolveImport, onDependency: trackDependency }
        }))
        dependencies.push(...delivered.dependencies.map(file => graph.dependencyFile(file)))
        return { code: delivered.css + '\n' + entry.exportsCSS, sourceMap: delivered.sourceMap, dependencies, postcss: preparedGraph.postcss }
      }
      let code = result.code
      let outputMap = result.sourceMap
      if (moduleStyle && result.globalStylesheet) {
        // Recompile the resource graph with publication URLs before relocating
        // globals. Local CSS stays on Next's native Module path; the generated
        // entry is already handled as global CSS by webpack-css-loader's pitch.
        let preparedGlobals: Awaited<ReturnType<typeof transformStylesheet>> | undefined
        const globals = await deliverNextStylesheet(resourcePath, projectDir ?? dirname(resourcePath), onDependency, async delivery => {
          // This compiler boundary contains generated resources, never child
          // stylesheet imports. Resource URLs are content-addressed and do not
          // depend on the entry revision, so the publication pass can reuse it.
          const delivered = preparedGlobals ??= await transformStylesheet(resourcePath, source, {
            baseManifest: projectManifest.manifest, loadSass, ...context, projectDir,
            referenceFiles: entries, transformNativeStylesheets: true, generatedGlobals: 'separate', delivery
          })
          dependencies.push(...delivered.dependencies)
          const css = delivered.globalStylesheet?.css ?? ''
          const sourceMap = delivered.globalStylesheet?.sourceMap ?? JSON.stringify({ version: 3, sources: [], names: [], mappings: '' })
          return { css, sourceMap, entry: resourcePath,
            stylesheets: [{ id: resourcePath, href: delivery.entryURL, css, sourceMap }],
            resources: delivered.resources }
        }, true)
        code = globals.css + '\n' + code
        if (outputMap) {
          const map = JSON.parse(outputMap)
          map.mappings = ';' + map.mappings
          outputMap = JSON.stringify(map)
        }
      }
      return {
        code,
        sourceMap: outputMap,
        dependencies
      }
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
