import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { MasterCSSStylesheetImportSource } from '@master/css-compiler/stylesheet'
import { prepareNextModule, type ModuleContext } from './prepare-module'
import { prepareNextStylesheet, type NextStylesheetLoaderOptions } from './prepare-stylesheet'

export interface PreparedNode extends MasterCSSStylesheetImportSource {
  exports: Record<string, string>
  exportsCSS: string
  scoped: boolean
}

interface GraphPreparation {
  raw?: boolean
  retainedImports?: Map<string, readonly string[]>
  inputs?: Map<string, MasterCSSStylesheetImportSource>
  transform?: (file: string, source: string, sourceMap?: string, resource?: string, scoped?: boolean) => Promise<{ source: string, sourceMap?: string, globalAnimations?: string[] }>
}

/** Resolve with Next, and share source preparation across the two publication passes. */
export function createNextModuleGraph(context: ModuleContext, projectDir: string, options: NextStylesheetLoaderOptions, onDependency: (file: string) => void, preparation: GraphPreparation = {}) {
  const require = createRequire(import.meta.url)
  const nextRequire = createRequire(require.resolve('next/package.json'))
  const { normalizeUrl, requestify, resolveRequests } = nextRequire('next/dist/build/webpack/loaders/css-loader/src/utils')
  const { generateExportEntry } = nextRequire('next/dist/compiled/postcss-modules-scope')
  const rawInputs = new Map<string, MasterCSSStylesheetImportSource>()
  const retainedImports = new Map<string, readonly string[]>()
  const webpack = Boolean(options.preprocessed)
  const resolver = context.getResolve?.(webpack ? { conditionNames: ['style'], extensions: ['.css'], mainFields: ['css', 'style', 'main', '...'], mainFiles: ['index', '...'] } : {})
  const nodes = new Map<string, Promise<PreparedNode>>()
  const modes = new Map<string, boolean>()
  const owners = new Map<string, string>()
  const sources = new Map<string, string>()
  const inlineResources = new Map<string, string>()
  const inlineSources = new Map<string, Promise<{ source: string, sourceMap?: string }>>()
  const icssFiles = new Map<string, string>()
  const rootScoped = /\.module\.(css|scss|sass)$/i.test(context.resourcePath)
  modes.set(context.resourcePath, rootScoped)
  owners.set(context.resourcePath, context.resourcePath)
  const physicalFile = (file: string) => {
    const resource = inlineResources.get(file) ?? file
    return existsSync(resource) ? resource : resource.replace(/[?#].*$/, '')
  }
  const scopeFor = (file: string, importer: string) => webpack ? Boolean(modes.get(importer)) : /\.module\.(css|scss|sass)$/i.test(physicalFile(file))

  async function resolveFile(specifier: string, importer: string, icss = false) {
    if (!resolver || specifier === '@master/css' || specifier === '@master/css-preset' || /^(?:https?:|data:|\/\/|#)/i.test(specifier)) return
    const cacheKey = `${importer}\0${specifier}`
    if (icssFiles.has(cacheKey)) return icssFiles.get(cacheKey)
    const owner = owners.get(importer) ?? importer
    const parts = webpack ? specifier.split('!') : [specifier]
    const resource = parts.pop()!
    // importModule uses the entry loader's directory. Resolve each inline
    // loader at its actual importing file with Webpack's configured resolver.
    const prefix = (await Promise.all(parts.map(async loader => {
      if (!loader) return loader
      const loaderResolver = context._compiler?.resolverFactory.get('loader')
      if (!loaderResolver) throw new Error('Inline CSS loaders require the Webpack loader resolver.')
      return new Promise<string>((resolve, reject) => loaderResolver.resolve({ issuer: owner }, dirname(owner), loader, {}, (error, result) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error(`Unable to resolve inline CSS loader: ${loader}`))
      }))
    }))).join('!')
    // Next's Module export normalizer decodes CSS escapes without URI decoding.
    // Turbo treats percent sequences literally; Webpack normalizes them as URLs.
    const normalized = !icss ? resource : webpack ? normalizeUrl(resource, true) : generateExportEntry(resource, resource).value
    const request = requestify(normalized, projectDir)
    const requests = webpack && icss ? [normalized, request] : [request, normalized]
    const resolvedResource = await resolveRequests(resolver, dirname(owner), [...new Set(requests)]) as string
    const resolved = prefix ? `${prefix}!${resolvedResource}` : resolvedResource
    if (prefix) inlineResources.set(resolved, resolvedResource)
    // Reuse the ICSS resolution for its retained CSS edge without decoding twice.
    if (icss) icssFiles.set(cacheKey, resolved)
    return resolved
  }

  async function prepare(file: string, scoped: boolean, chain: readonly string[] = [], source?: string, sourceMap?: string): Promise<PreparedNode> {
    const key = `${scoped ? 'module' : 'global'}:${file}`
    if (chain.includes(key)) throw new Error(`Circular ICSS dependency: ${[...chain, key].join(' -> ')}`)
    let promise = nodes.get(key)
    if (promise) return promise
    const baseFile = physicalFile(file)
    const id = file === context.resourcePath && scoped === rootScoped ? file : `\0next-css:${key}`
    owners.set(id, baseFile)
    modes.set(id, scoped)
    promise = (async () => {
      onDependency(baseFile)
      const supplied = preparation.inputs?.get(id)
      if (supplied) { source = supplied.source; sourceMap = supplied.sourceMap }
      if (source === undefined) {
        let input: { source: string, sourceMap?: string }
        if (inlineResources.has(file)) {
          if (!context.importModule) throw new Error('Inline CSS loaders require the Webpack importModule capability.')
          let prepared = inlineSources.get(file)
          if (!prepared) {
            prepared = context.importModule(`!!${fileURLToPath(new URL('./stylesheet-source-loader.js', import.meta.url))}!${file}`)
            inlineSources.set(file, prepared)
          }
          input = await prepared
        } else {
          if (!sources.has(baseFile)) sources.set(baseFile, readFileSync(baseFile, 'utf8'))
          input = { source: sources.get(baseFile)! }
        }
        const prepared = await prepareNextStylesheet(baseFile, input.source, projectDir, options, onDependency)
        source = prepared.source
        sourceMap = prepared.sourceMap ?? input.sourceMap
      }
      const childContext = Object.create(context) as ModuleContext
      childContext.resourcePath = baseFile
      childContext.context = dirname(baseFile)
      if (preparation.raw) {
        // Let Next's own ICSS processors discover dependencies without scoping
        // selectors or validating purity before the user's PostCSS transforms.
        const postcss = nextRequire('postcss')
        const { extractICSS } = nextRequire('next/dist/compiled/icss-utils')
        const inspected = await postcss([
          nextRequire('next/dist/compiled/postcss-modules-values')(),
          nextRequire('next/dist/compiled/postcss-modules-extract-imports')()
        ]).process(source, { from: baseFile, to: baseFile, map: false })
        const specifiers = Object.keys(extractICSS(inspected.root).icssImports)
        retainedImports.set(id, specifiers)
        const map = { inline: false, annotation: false, sourcesContent: true, prev: sourceMap ? JSON.parse(sourceMap) : false }
        const root = postcss.parse(source, { from: baseFile, map })
        let previous = root.nodes.findLast((node: { type: string, name?: string }) => node.type === 'atrule' && node.name === 'import')
        for (const specifier of specifiers) {
          await resolveFile(specifier, id, true)
          const rule = postcss.atRule({ name: 'import', params: JSON.stringify(specifier) })
          if (previous) root.insertAfter(previous, rule)
          else root.prepend(rule)
          previous = rule
        }
        const output = root.toResult({ from: baseFile, to: baseFile, map })
        const outputMap = output.map.toJSON()
        // Next's input-map normalizer resolves path sources against process cwd.
        // Our producer owns their base: this stylesheet, not the project root.
        outputMap.sources = outputMap.sources.map((file: string) => file.startsWith('<') ? file : new URL(file, pathToFileURL(baseFile)).href)
        const input = { id, baseFile, source: output.css, sourceMap: JSON.stringify(outputMap) }
        rawInputs.set(id, input)
        return { ...input, exports: {}, exportsCSS: '', scoped }
      }
      let globalAnimations: string[] | undefined
      if (preparation.transform) {
        const resource = file === context.resourcePath ? context.resource ?? file : inlineResources.get(file) ?? file
        const transformed = await preparation.transform(baseFile, source, sourceMap, resource, scoped)
        source = transformed.source
        sourceMap = transformed.sourceMap
        globalAnimations = transformed.globalAnimations
      }
      const module = await prepareNextModule(childContext, source, projectDir, sourceMap, webpack, {
        scoped,
        retainedImports: preparation.retainedImports?.get(id),
        globalAnimations,
        async resolveICSS(specifier) {
          const resolved = await resolveFile(specifier, id, true)
          if (!resolved) throw new Error(`Unable to resolve CSS Module dependency: ${specifier}`)
          const imported = await prepare(resolved, scopeFor(resolved, id), [...chain, key])
          return imported.exports
        }
      })
      return { id, baseFile, source: module.source, sourceMap: module.sourceMap, exports: module.exports, exportsCSS: module.exportsCSS, scoped }
    })()
    nodes.set(key, promise)
    return promise
  }

  return {
    inputs: rawInputs,
    retainedImports,
    dependencyFile(file: string) { return owners.get(file) ?? file },
    prepareEntry(source: string, sourceMap?: string) { return prepare(context.resourcePath, rootScoped, [], source, sourceMap) },
    async resolveImport(specifier: string, importer: string) {
      const resolved = await resolveFile(specifier, importer)
      if (!resolved) return undefined
      return prepare(resolved, scopeFor(resolved, importer))
    }
  }
}
