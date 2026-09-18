import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { MasterCSSStylesheetImportSource } from '@master/css-compiler/stylesheet'
import { prepareNextModule, type ModuleContext } from './prepare-module'
import { prepareNextStylesheet, type NextStylesheetLoaderOptions } from './prepare-stylesheet'

interface PreparedNode extends MasterCSSStylesheetImportSource {
  exports: Record<string, string>
  exportsCSS: string
  scoped: boolean
}

/** Resolve with Next, and share source preparation across the two publication passes. */
export function createNextModuleGraph(context: ModuleContext, projectDir: string, options: NextStylesheetLoaderOptions, onDependency: (file: string) => void) {
  const require = createRequire(import.meta.url)
  const nextRequire = createRequire(require.resolve('next/package.json'))
  const { normalizeUrl, requestify, resolveRequests } = nextRequire('next/dist/build/webpack/loaders/css-loader/src/utils')
  const { generateExportEntry } = nextRequire('next/dist/compiled/postcss-modules-scope')
  const webpack = Boolean(options.preprocessed)
  const resolver = context.getResolve?.(webpack ? { conditionNames: ['style'], extensions: ['.css'], mainFields: ['css', 'style', 'main', '...'], mainFiles: ['index', '...'] } : {})
  const nodes = new Map<string, Promise<PreparedNode>>()
  const modes = new Map<string, boolean>()
  const owners = new Map<string, string>()
  const sources = new Map<string, string>()
  const icssFiles = new Map<string, string>()
  const rootScoped = /\.module\.(css|scss|sass)$/i.test(context.resourcePath)
  modes.set(context.resourcePath, rootScoped)
  owners.set(context.resourcePath, context.resourcePath)
  const physicalFile = (file: string) => existsSync(file) ? file : file.replace(/[?#].*$/, '')
  const scopeFor = (file: string, importer: string) => webpack ? Boolean(modes.get(importer)) : /\.module\.(css|scss|sass)$/i.test(physicalFile(file))

  async function resolveFile(specifier: string, importer: string, icss = false) {
    if (!resolver || specifier === '@master/css' || specifier === '@master/css-preset' || /^(?:https?:|data:|\/\/|#)/i.test(specifier)) return
    const cacheKey = `${importer}\0${specifier}`
    if (icssFiles.has(cacheKey)) return icssFiles.get(cacheKey)
    const owner = owners.get(importer) ?? importer
    // Next's Module export normalizer decodes CSS escapes without URI decoding.
    // Turbo treats percent sequences literally; Webpack normalizes them as URLs.
    const normalized = !icss ? specifier : webpack ? normalizeUrl(specifier, true) : generateExportEntry(specifier, specifier).value
    const request = requestify(normalized, projectDir)
    const requests = webpack && icss ? [normalized, request] : [request, normalized]
    const resolved = await resolveRequests(resolver, dirname(owner), [...new Set(requests)]) as string
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
      if (source === undefined) {
        if (!sources.has(baseFile)) sources.set(baseFile, readFileSync(baseFile, 'utf8'))
        const prepared = await prepareNextStylesheet(baseFile, sources.get(baseFile)!, projectDir, options, onDependency)
        source = prepared.source
        sourceMap = prepared.sourceMap
      }
      const childContext = Object.create(context) as ModuleContext
      childContext.resourcePath = baseFile
      childContext.context = dirname(baseFile)
      const module = await prepareNextModule(childContext, source, projectDir, sourceMap, webpack, !webpack && scoped && file === context.resourcePath ? undefined : {
        scoped,
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
    dependencyFile(file: string) { return owners.get(file) ?? file },
    prepareEntry(source: string, sourceMap?: string) { return prepare(context.resourcePath, rootScoped, [], source, sourceMap) },
    async resolveImport(specifier: string, importer: string) {
      const resolved = await resolveFile(specifier, importer)
      if (!resolved) return undefined
      return prepare(resolved, scopeFor(resolved, importer))
    }
  }
}
