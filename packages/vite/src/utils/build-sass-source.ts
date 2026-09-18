import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { preprocessCSS, type ResolvedConfig } from 'vite'
import { createModuleSourceProjection, moduleSourceOwner, type ModuleSourceDiagnostic } from './module-sources'
import { createSassSourceMarkers } from './sass-source-markers'
import type { MasterCSSVitePluginContext } from '../core'

const CSS_SUFFIX = '.master-css-sass.css'
const MODULE_PREFIX = '\0master-css:sass-module:'
type PreparedSource = Awaited<ReturnType<typeof preprocessCSS>> & { moduleSources?: Map<string, string>, moduleDiagnostics?: Map<string, ModuleSourceDiagnostic> }
const caches = new WeakMap<MasterCSSVitePluginContext, Map<string, { source: string, prepared?: Promise<PreparedSource>, dependencies: Set<string> }>>()

export function getSassSourceFile(id: string) {
  id = id.replace(/[?#].*$/, '')
  if (id.startsWith(MODULE_PREFIX)) return decodeURIComponent(id.slice(MODULE_PREFIX.length, -3))
  if (id.endsWith(CSS_SUFFIX)) return id.slice(0, -CSS_SUFFIX.length)
}

export function sassSourceID(file: string) {
  // A filesystem-shaped CSS identity retains Vite's own relative URL resolution.
  return `${file}${CSS_SUFFIX}`
}

export function sassModuleID(file: string) {
  return MODULE_PREFIX + encodeURIComponent(file) + '.js'
}

export function isSassModuleID(id: string) {
  return id.startsWith(MODULE_PREFIX)
}

export function isRawStyleRequest(id: string) {
  return /[?&](?:raw|url)(?:[=&]|$)/.test(id)
}

export function clearBuildSassSources(context: MasterCSSVitePluginContext) {
  caches.delete(context)
}

/** Invalidate every prepared owner of an edited source or composed dependency. */
export function invalidatePreparedSassSources(context: MasterCSSVitePluginContext, file: string) {
  const cache = caches.get(context)
  const affected: string[] = []
  for (const [owner, entry] of cache ?? []) {
    if (owner !== file && !entry.dependencies.has(file)) continue
    // Keep the last dependency edges while an owner is invalid or failing.
    entry.prepared = undefined
    affected.push(owner)
  }
  return affected
}

export function getPreparedSassSource(context: MasterCSSVitePluginContext, id: string) {
  const file = getSassSourceFile(id) ?? id.replace(/[?#].*$/, '')
  const cached = caches.get(context)?.get(file)
  return cached?.prepared ? { file, ...cached, prepared: cached.prepared } : undefined
}

/** Diagnostics for a projected child use its own source and generated map. */
export async function getPreparedSassDiagnosticSource(context: MasterCSSVitePluginContext, id: string) {
  const scoped = moduleSourceOwner(id)
  const cached = getPreparedSassSource(context, scoped?.owner ?? id)
  if (!cached) return
  const prepared = await cached.prepared
  if (!scoped) return { file: cached.file, source: cached.source, generatedID: id, prepared }
  const child = prepared.moduleDiagnostics?.get(scoped.file)
  if (child) return { file: scoped.file, source: child.source, generatedID: sassSourceID(scoped.file), prepared: child }
}

/** Carry the host's map alongside CSS so reference lookup can retain partial origins. */
export async function getPreparedSassSourceMap(context: MasterCSSVitePluginContext, id: string) {
  const cached = await getPreparedSassDiagnosticSource(context, id)
  const map = cached?.prepared.map
  return map ? typeof map === 'string' ? map : JSON.stringify(map) : undefined
}

/** Use Vite's preprocessors/Modules and URL rebasing, leaving imports for Rust. */
export function prepareBuildSassSource(context: MasterCSSVitePluginContext, file: string, onDependency?: (file: string) => void) {
  if (!context.config) throw new Error('Sass preparation requires resolved Vite configuration.')
  let cache = caches.get(context)
  if (!cache) { cache = new Map(); caches.set(context, cache) }
  let cached = cache.get(file)
  if (!cached?.prepared) {
    const sourceMarkers = createSassSourceMarkers()
    const preserveImports = {
      postcssPlugin: 'master-css:preserve-preprocessor-imports',
      prepare({ root }: { root: { walkAtRules(visitor: (rule: { name: string }) => void): void, walkComments(visitor: (comment: { text: string, remove(): void }) => void): void } }) {
        const imports: { rule: { name: string }, name: string }[] = []
        // prepare runs before postcss-import's Once hook. Restore before printing.
        root.walkAtRules(rule => {
          if (rule.name.toLowerCase() !== 'import') return
          imports.push({ rule, name: rule.name })
          rule.name = '--master-css-preserved-import'
        })
        return { OnceExit() {
          for (const { rule, name } of imports) rule.name = name
          if (!projection) root.walkComments(comment => { if (sourceMarkers.markers.has(comment.text.trim())) comment.remove() })
        } }
      }
    }
    const config = context.config
    const source = readFileSync(file, 'utf8')
    const projection = /\.module\.(?:css|scss|sass)$/.test(file) && config.css.modules !== false ? createModuleSourceProjection(file) : undefined
    const dependencies = new Set(cached?.dependencies)
    const discovered = new Set<string>()
    let importDirectory: Promise<string> | undefined
    const importedSources = new Map<string, Promise<string>>()
    const originalFile = (id: string) => projection?.sourceFiles.get(id) ?? id
    const preprocessorConfig: ResolvedConfig = {
      ...config,
      createResolver(options) {
        const resolve = config.createResolver(options)
        const cssImport = options?.extensions?.length === 1 && options.extensions[0] === '.css'
        return async (...args) => {
          if (args[1]) args[1] = originalFile(args[1])
          const resolved = await resolve(...args)
          if (resolved && isAbsolute(resolved)) { dependencies.add(resolved); discovered.add(resolved) }
          if (resolved && projection && cssImport && /\.(?:scss|sass)$/.test(resolved)) {
            let prepared = importedSources.get(resolved)
            if (!prepared) {
              prepared = prepareImportedSource(resolved)
              importedSources.set(resolved, prepared)
            }
            return prepared
          }
          return resolved
        }
      },
      css: {
        ...config.css,
        devSourcemap: true,
        preprocessorOptions: {
          ...config.css.preprocessorOptions,
          scss: { ...config.css.preprocessorOptions?.scss, sourceMapIncludeSources: true, additionalData: (projection ?? sourceMarkers).additionalData(config.css.preprocessorOptions?.scss?.additionalData) },
          sass: { ...config.css.preprocessorOptions?.sass, sourceMapIncludeSources: true, additionalData: (projection ?? sourceMarkers).additionalData(config.css.preprocessorOptions?.sass?.additionalData) }
        },
        transformer: 'postcss', postcss: { plugins: [projection?.plugin ?? preserveImports] }
      }
    }
    async function prepareImportedSource(id: string) {
      // Vite's CSS-import loader keeps only preprocessed code, losing its map.
      // Prepare once with Vite, then let its normal importer read mapped CSS.
      const result = await preprocessCSS(readFileSync(id, 'utf8'), id, {
        ...preprocessorConfig,
        css: { ...preprocessorConfig.css, modules: false, postcss: { plugins: [preserveImports] } }
      })
      for (const dependency of result.deps ?? []) { discovered.add(originalFile(dependency)); dependencies.add(originalFile(dependency)) }
      importDirectory ??= mkdir(config.cacheDir, { recursive: true }).then(() => mkdtemp(join(config.cacheDir, 'master-css-sass-import-')))
      const path = join(await importDirectory, `${createHash('sha256').update(id).digest('hex')}.css`)
      projection!.sourceFiles.set(path, id)
      const raw = typeof result.map === 'string' ? JSON.parse(result.map) as { sources?: string[], sourceRoot?: string } : result.map
      const base = new URL(raw && 'sourceRoot' in raw && raw.sourceRoot ? raw.sourceRoot.replace(/\/?$/, '/') : './', pathToFileURL(id))
      const map = raw && 'sources' in raw && raw.sources ? JSON.stringify({ ...raw, sourceRoot: '', sources: raw.sources.map(source => source ? new URL(source, base).href : source) }) : undefined
      const annotation = map ? `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(map).toString('base64')} */` : ''
      await writeFile(path, result.code + annotation)
      return path
    }
    const prepared = preprocessCSS(source, file, preprocessorConfig).then(result => {
      // Only successful preprocessing can replace the previous dependency graph.
      for (const dependency of result.deps ?? []) discovered.add(originalFile(dependency))
      if (projection) for (const dependency of result.deps ?? []) {
        const file = originalFile(dependency)
        if (/\.css$/i.test(file) && !projection.sources.has(file)) {
          projection.copyDuplicate(file, readFileSync(file, 'utf8'))
        }
      }
      dependencies.clear()
      for (const dependency of discovered) dependencies.add(dependency)
      return { ...result, deps: dependencies, ...(projection ? { moduleSources: projection.sources, moduleDiagnostics: projection.diagnostics } : {}) }
    }).finally(async () => {
      // Finish all started loads before removing this invocation's directory.
      await Promise.allSettled(importedSources.values())
      if (importDirectory) await rm(await importDirectory, { recursive: true, force: true })
    })
    cached = { source, prepared, dependencies }
    cache.set(file, cached)
  }
  const entry = cached, prepared = entry.prepared!
  // Replay even after preprocessing fails so edits to a resolved child can
  // recover the build. Cached callers register the same discovered dependencies.
  return onDependency ? prepared.finally(() => {
    for (const dependency of entry.dependencies) onDependency(dependency)
  }) : prepared
}
