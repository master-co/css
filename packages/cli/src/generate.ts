import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import type {
  MasterCSSScanner
} from '@master/css-tooling/scanner/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSStylesheetCollection, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import type { FSWatcher } from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_SCAN_OUTPUT } from './constants'
import { createSourceWatchPlan } from './source-watch'
import { publishOwnedStylesheet, stylesheetStatePath } from './asset-ownership'
import { withStylesheetPublicationLock } from './publication-lock'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,mjs,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
type FastGlob = Pick<typeof import('fast-glob'), 'sync' | 'generateTasks'>
type Chokidar = typeof import('chokidar').default
type Bytes = (value: number) => string
type MasterCSSScannerConstructor =
  typeof import('@master/css-tooling/scanner/node').MasterCSSScanner
type StylesheetModule = typeof import('@master/css-compiler/stylesheet')
type ProjectModule = typeof import('@master/css-compiler/project')

let scannerModulePromise: Promise<MasterCSSScannerConstructor> | undefined
let stylesheetModulePromise: Promise<StylesheetModule> | undefined
let projectModulePromise: Promise<ProjectModule> | undefined
let fastGlobModulePromise: Promise<FastGlob> | undefined
let chokidarModulePromise: Promise<Chokidar> | undefined
let bytesPromise: Promise<Bytes> | undefined

export interface GenerateOptions {
  watch?: boolean
  output?: string
  verbose?: string | number
  export?: boolean
  cwd?: string
  binding?: 'auto' | 'native' | 'wasm'
}

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function registerManagedCSSEntries(
  scanner: MasterCSSScanner,
  stylesheets: MasterCSSStylesheetCollection,
  delivery?: MasterCSSStylesheetDeliveryOptions
) {
  const [
    _stylesheet,
    { discoverManifestEntries }
  ] = await Promise.all([
    loadStylesheetModule(),
    loadProjectModule()
  ])
  stylesheets.clear()
  for (const entry of await discoverManifestEntries({ root: scanner.cwd })) {
    delivery?.onDependency?.(entry)
    await stylesheets.register(scanner, entry, fs.readFileSync(entry, 'utf8'), {
      baseManifest: defaultManifest,
      projectDir: scanner.cwd,
      delivery
    })
  }
  scanner.resetDependencies = [...stylesheets.snapshot().dependencies]
}

function normalizeSourcePatterns(specifiedSourcePaths?: string[]) {
  return specifiedSourcePaths?.length ? specifiedSourcePaths : DEFAULT_SOURCE_PATTERNS
}

function normalizeGlobPatterns(patterns: readonly string[]) {
  return patterns.map((pattern) => pattern.replace(/\\/g, '/'))
}

function resolveSourcePaths(
  scanner: MasterCSSScanner,
  fg: FastGlob,
  sourcePatterns: string[],
  ignore: readonly string[] = []
) {
  return fg.sync(normalizeGlobPatterns(sourcePatterns), {
    cwd: scanner.cwd,
    ignore: normalizeGlobPatterns(ignore)
  })
    .filter(Boolean)
}

async function scanSourceFile(scanner: MasterCSSScanner, source: string) {
  const filepath = path.resolve(scanner.cwd, source)
  await scanner.scan(source, fs.readFileSync(filepath, 'utf8'))
}

async function scanSourceFiles(scanner: MasterCSSScanner, sourcePaths: string[]) {
  await Promise.all(sourcePaths.map((source) => scanSourceFile(scanner, source)))
}

async function prepareScanner(
  scanner: MasterCSSScanner,
  stylesheets: MasterCSSStylesheetCollection,
  sourcePaths: string[],
  delivery?: MasterCSSStylesheetDeliveryOptions
) {
  await registerManagedCSSEntries(scanner, stylesheets, delivery)
  await scanSourceFiles(scanner, sourcePaths)
}

async function reportExport(scanner: MasterCSSScanner, css: string, filename = DEFAULT_SCAN_OUTPUT) {
  const filepath = path.resolve(scanner.cwd, filename)
  if (scanner.options.verbose) {
    const bytes = await loadBytes()
    process.stderr.write(`${filename} exported ${bytes(css.length)}\n`)
  }
  scanner.emit('export', filename, filepath)
}

function formatWatchedPath(cwd: string, file: string) {
  return path.isAbsolute(file) ? path.relative(cwd, file) : file
}

function createDependencyWatchPlan(dependencies: Set<string>) {
  const contains = (parent: string, file: string) => {
    const relative = path.relative(parent, file)
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  }
  const directories = [...dependencies].filter(file => fs.statSync(file, { throwIfNoEntry: false })?.isDirectory())
  const matches = (file: string) => dependencies.has(file) || directories.some(directory => contains(directory, file))
  const roots = [...new Set([...dependencies].map(file => {
    let directory = path.dirname(file)
    while (!fs.statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
      const parent = path.dirname(directory)
      if (parent === directory) break
      directory = parent
    }
    return directory
  }))]
  return {
    roots: roots.filter(root => !roots.some(other => root !== other && contains(other, root))),
    matches,
    ignored(file: string, stats?: fs.Stats) {
      if (stats?.isDirectory()) return !matches(file) && ![...dependencies].some(target => contains(file, target))
      return stats?.isFile() ? !matches(file) : false
    }
  }
}

async function waitForWatcherReady(watcher: FSWatcher) {
  await new Promise<void>((resolve) => watcher.once('ready', resolve))
  // Let chokidar finish registering native watchers before callers mutate files.
  await new Promise((resolve) => setTimeout(resolve, 0))
}

export default async function runGenerate(specifiedSourcePaths: string[] = [], options: GenerateOptions = {}) {
  const pipelineModules = Promise.all([
    loadStylesheetModule(),
    loadProjectModule()
  ])
  const [
    MasterCSSScanner,
    fg
  ] = await Promise.all([
    loadCSSScanner(),
    loadFastGlob()
  ])
  const { watch, output, verbose, cwd } = options
  const scanner = new MasterCSSScanner({
    manifest: defaultManifest,
    binding: options.binding,
    exclude: specifiedSourcePaths.length
      ? undefined
      : ['**/node_modules/**', 'node_modules'],
    verbose: verbose ? +verbose : undefined
  }, cwd)
  const { createStylesheetCollection } = await loadStylesheetModule()
  const stylesheets = createStylesheetCollection()
  const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
  const outputPath = path.resolve(scanner.cwd, output || DEFAULT_SCAN_OUTPUT)
  const outputFiles = new Set<string>([outputPath, stylesheetStatePath(outputPath)])
  const attemptedDependencies = new Set<string>()
  const missingDependencies = new Set<string>()
  const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex').slice(0, 20)
  const assetPrefix = `master-${hash(path.relative(scanner.cwd, outputPath))}`
  let revision = ''
  let resourceBytes: Map<string, Buffer> | undefined
  const readResource = (file: string) => {
    const bytes = resourceBytes?.get(file) ?? fs.readFileSync(file)
    resourceBytes?.set(file, bytes)
    return bytes
  }
  const delivery: MasterCSSStylesheetDeliveryOptions | undefined = options.export ? {
    entryURL: `./${encodeURIComponent(path.basename(outputPath))}`,
    onDependency: watch ? file => {
      const absolute = path.resolve(file)
      attemptedDependencies.add(absolute)
      if (!fs.existsSync(absolute)) missingDependencies.add(absolute)
    } : undefined,
    stylesheetURL: (file, variant) => `./${assetPrefix}-${revision}${hash(path.relative(scanner.cwd, file) + (variant?.slice(file.length) ?? ''))}.css`,
    resourceURL: file => `./${assetPrefix}-${hash(readResource(file))}${encodeURIComponent(path.extname(file))}`,
    relativeResourceURLs: true
  } : undefined

  const writeOutput = async () => {
    const compose = () => stylesheets.compose({
      scanner,
      baseManifest: defaultManifest,
      projectDir: scanner.cwd,
      delivery
    })
    revision = ''
    resourceBytes = options.export ? new Map() : undefined
    try {
      let composition = await compose()
      if (options.export) {
        // Derive a stable revision from rendered content, then let the compiler
        // render imports with those URLs. CSS rewriting remains in Rust.
        revision = `${hash(JSON.stringify({ css: composition.css, stylesheets: composition.stylesheets?.map(({ href, css }) => ({ href, css })) }))}-`
        composition = await compose()
        const assets = new Map<string, Buffer>()
        const addAsset = (href: string, bytes: Buffer) => {
          const target = fileURLToPath(new URL(href, pathToFileURL(outputPath)))
          if (assets.has(target) && !assets.get(target)!.equals(bytes)) throw new Error(`Conflicting stylesheet assets: ${target}`)
          assets.set(target, bytes)
        }
        for (const asset of composition.stylesheets || []) addAsset(asset.href, Buffer.from(asset.css))
        for (const asset of composition.resources || []) addAsset(asset.href, readResource(asset.file))
        await withStylesheetPublicationLock(() => publishOwnedStylesheet(outputPath, composition.css, assets, outputFiles))
        scanner.resetDependencies = [...new Set([...scanner.resetDependencies, ...(composition.dependencies || [])])]
        await reportExport(scanner, composition.css, output)
      } else {
        process.stdout.write(`${composition.css}\n`)
      }
    } finally {
      revision = ''
      resourceBytes = undefined
    }
  }
  await scanner.init()
  const scanPaths = () => resolveSourcePaths(
    scanner,
    fg,
    sourcePatterns,
    specifiedSourcePaths.length ? [] : scanner.options.exclude
  ).filter(file => !options.export || !outputFiles.has(path.resolve(scanner.cwd, file)))
  if (watch) {
    const chokidar = await loadChokidar()
    const watchers: FSWatcher[] = []
    let pipelineReady = false
    let stopped = false
    let writing = Promise.resolve()
    let planWatcher: FSWatcher | undefined
    let watchedDependencies = new Set<string>()
    const closeWatchers = async () => {
      await Promise.all(watchers.splice(0).map((watcher) => watcher.close()))
    }
    const shutdown = async () => {
      stopped = true
      await writing
      await closeWatchers()
      await scanner.dispose()
      stylesheets.dispose()
    }
    const syncDependencies = async (dependencies: Iterable<string>) => {
      if (stopped) return
      const next = new Set([...dependencies].map(file => path.resolve(scanner.cwd, file)))
      if (next.size === watchedDependencies.size && [...next].every(file => watchedDependencies.has(file))) return
      const previous = planWatcher
      if (next.size) {
        const plan = createDependencyWatchPlan(next)
        planWatcher = chokidar.watch(plan.roots, {
          ignoreInitial: true,
          ignored: (file, stats) => (options.export && outputFiles.has(path.resolve(scanner.cwd, file))) || plan.ignored(file, stats)
        })
        for (const event of ['add', 'change', 'unlink'] as const) {
          planWatcher.on(event, file => {
            if (!plan.matches(file) || (options.export && outputFiles.has(path.resolve(scanner.cwd, file)))) return
            if (scanner.options.verbose) process.stderr.write(`\n[change] ${formatWatchedPath(scanner.cwd, file)}\n`)
            void enqueue(() => rebuild())
          })
        }
        watchers.push(planWatcher)
        // Keep the old watcher alive until every newly attempted file is watched.
        await waitForWatcherReady(planWatcher)
      } else planWatcher = undefined
      if (previous) {
        watchers.splice(watchers.indexOf(previous), 1)
        await previous.close()
      }
      watchedDependencies = next
    }
    const rebuild = async (initial = false) => {
      pipelineReady = false
      attemptedDependencies.clear()
      missingDependencies.clear()
      if (!initial) await scanner.reset(scanner.customOptions, { emit: false })
      await prepareScanner(scanner, stylesheets, scanPaths(), delivery)
      await writeOutput()
      await syncDependencies([...scanner.resetDependencies, ...attemptedDependencies])
      pipelineReady = true
      missingDependencies.clear()
      process.stderr.write(initial ? '\nStart watching source changes\n' : '\nRestart watching source changes\n')
      if (!initial) scanner.emit('resetDependencyChange')
    }
    const enqueue = (operation: () => Promise<void>) => {
      writing = writing.then(async () => {
        if (!stopped) await operation()
      }).catch(async (error: unknown) => {
        pipelineReady = false
        const missing = (error as NodeJS.ErrnoException)?.path
        if (missing) attemptedDependencies.add(path.resolve(scanner.cwd, missing))
        // Failed attempts keep both the last working graph and newly attempted
        // files watched. In particular, a missing file must be able to recover.
        await syncDependencies([...watchedDependencies, ...scanner.resetDependencies, ...attemptedDependencies])
        process.stderr.write(`Cannot rebuild CSS: ${error}\n`)
        // Creation during watcher registration is an initial scan, not an add
        // event. Recheck failed paths after readiness to close that recovery gap.
        if (!stopped && [...missingDependencies].some(file => fs.existsSync(file))) {
          void enqueue(() => rebuild())
        }
      })
      return writing
    }
    const startSourceWatcher = async () => {
      const sourcePlan = createSourceWatchPlan(fg, scanner.cwd, sourcePatterns,
        specifiedSourcePaths.length ? [] : scanner.options.exclude)
      if (!sourcePlan.roots.length) return
      const sourceWatcher = chokidar.watch(sourcePlan.roots, {
        cwd: scanner.cwd,
        ignoreInitial: true,
        ignored: (file, stats) => (options.export && outputFiles.has(path.resolve(scanner.cwd, file))) || sourcePlan.ignored(file, stats)
      })
      const scanChangedSource = (source: string) => {
        if (!sourcePlan.matches(source)) return
        void enqueue(async () => {
          if (!pipelineReady) return rebuild()
          await scanSourceFile(scanner, source)
          await writeOutput()
        })
      }
      sourceWatcher.on('add', scanChangedSource)
      sourceWatcher.on('change', scanChangedSource)
      watchers.push(sourceWatcher)
      await waitForWatcherReady(sourceWatcher)
    }
    process.once('SIGTERM', () => {
      void shutdown().finally(() => process.exit(0))
    })
    process.once('SIGINT', () => {
      void shutdown().finally(() => process.exit(0))
    })
    try {
      await pipelineModules
      await startSourceWatcher()
      await enqueue(() => rebuild(true))
    } catch (error) {
      await shutdown()
      throw error
    }
  } else {
    try {
      await pipelineModules
      await prepareScanner(scanner, stylesheets, scanPaths(), delivery)
      await writeOutput()
    } finally {
      await scanner.dispose()
      stylesheets.dispose()
    }
  }
}

function loadCSSScanner() {
  scannerModulePromise ||= import('@master/css-tooling/scanner/node')
    .then((mod) => mod.MasterCSSScanner)
  return scannerModulePromise
}

function loadStylesheetModule() {
  stylesheetModulePromise ||= import('@master/css-compiler/stylesheet')
  return stylesheetModulePromise
}

function loadProjectModule() {
  projectModulePromise ||= import('@master/css-compiler/project')
  return projectModulePromise
}

function loadFastGlob() {
  fastGlobModulePromise ||= import('fast-glob').then((mod) => mod.default || mod)
  return fastGlobModulePromise
}

function loadChokidar() {
  chokidarModulePromise ||= import('chokidar').then((mod) => mod.default)
  return chokidarModulePromise
}

function loadBytes() {
  bytesPromise ||= import('bytes').then((mod) => (mod as unknown as { default?: Bytes }).default || mod as unknown as Bytes)
  return bytesPromise
}
