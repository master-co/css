import type {
  MasterCSSScanner
} from '@master/css-tooling/scanner/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { StylesheetSources } from '@master/css-compiler/stylesheet'
import type { FSWatcher } from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_SCAN_OUTPUT } from './constants'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
type FastGlob = Pick<typeof import('fast-glob'), 'sync'>
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
  backend?: 'auto' | 'native' | 'wasm'
}

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function registerManagedCSSEntries(scanner: MasterCSSScanner, stylesheetSources: StylesheetSources) {
  const [
    { registerStylesheetSource },
    { discoverManifestEntries }
  ] = await Promise.all([
    loadStylesheetModule(),
    loadProjectModule()
  ])
  stylesheetSources.clear()
  for (const entry of await discoverManifestEntries({ root: scanner.cwd })) {
    await registerStylesheetSource(scanner, stylesheetSources, entry, fs.readFileSync(entry, 'utf8'), {
      baseManifest: defaultManifest,
      projectDir: scanner.cwd
    })
  }
  scanner.resetDependencies = [...new Set(
    Array.from(stylesheetSources.values()).flatMap((source) => source.dependencies)
  )]
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

async function prepareScanner(scanner: MasterCSSScanner, stylesheetSources: StylesheetSources, sourcePaths: string[]) {
  await registerManagedCSSEntries(scanner, stylesheetSources)
  await scanSourceFiles(scanner, sourcePaths)
}

async function exportCSS(scanner: MasterCSSScanner, css: string, filename = DEFAULT_SCAN_OUTPUT) {
  const filepath = path.resolve(scanner.cwd, filename)
  const dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filepath, css)
  if (scanner.options.verbose) {
    const bytes = await loadBytes()
    process.stderr.write(`${filename} exported ${bytes(css.length)}\n`)
  }
  scanner.emit('export', filename, filepath)
}

function formatWatchedPath(cwd: string, file: string) {
  return path.isAbsolute(file) ? path.relative(cwd, file) : file
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
    exclude: specifiedSourcePaths.length
      ? undefined
      : ['**/node_modules/**', 'node_modules'],
    verbose: verbose ? +verbose : undefined
  }, cwd)
  const stylesheetSources: StylesheetSources = new Map()
  const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
  const writeOutput = async () => {
    const { createExtractedCSS } = await loadStylesheetModule()
    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: scanner.cwd
    })
    if (options.export) {
      await exportCSS(scanner, css, output)
    } else {
      process.stdout.write(`${css}\n`)
    }
  }
  await scanner.init()
  const scanPaths = () => resolveSourcePaths(
    scanner,
    fg,
    sourcePatterns,
    specifiedSourcePaths.length ? [] : scanner.options.exclude
  )
  if (watch) {
    const chokidar = await loadChokidar()
    const watchers: FSWatcher[] = []
    let restarting = false
    let writing = Promise.resolve()
    const queueWrite = () => {
      writing = writing.then(writeOutput)
      return writing
    }
    const closeWatchers = async () => {
      await Promise.all(watchers.splice(0).map((watcher) => watcher.close()))
    }
    const shutdown = async () => {
      await closeWatchers()
      await scanner.dispose()
    }
    const startWatchers = async () => {
      const sourcePaths = scanPaths()
      if (sourcePaths.length) {
        const sourceWatcher = chokidar.watch(sourcePaths, {
          cwd: scanner.cwd,
          ignoreInitial: true
        })
        sourceWatcher.on('add', (source) => {
          void scanSourceFile(scanner, source).then(queueWrite)
        })
        sourceWatcher.on('change', (source) => {
          void scanSourceFile(scanner, source).then(queueWrite)
        })
        watchers.push(sourceWatcher)
        await waitForWatcherReady(sourceWatcher)
      }
      if (scanner.resetDependencies.length) {
        const planWatcher = chokidar.watch(scanner.resetDependencies, {
          ignoreInitial: true
        })
        const handlePlanChange = async (resetDependency: string) => {
          if (restarting) return
          restarting = true
          try {
            if (scanner.options.verbose) {
              process.stderr.write(`\n[change] ${formatWatchedPath(scanner.cwd, resetDependency)}\n`)
            }
            await closeWatchers()
            await scanner.reset(scanner.customOptions, { emit: false })
            await prepareScanner(scanner, stylesheetSources, scanPaths())
            await queueWrite()
            await startWatchers()
            process.stderr.write('\nRestart watching source changes\n')
            scanner.emit('resetDependencyChange')
          } finally {
            restarting = false
          }
        }
        planWatcher.on('add', (resetDependency) => {
          void handlePlanChange(resetDependency)
        })
        planWatcher.on('change', (resetDependency) => {
          void handlePlanChange(resetDependency)
        })
        planWatcher.on('unlink', (resetDependency) => {
          void handlePlanChange(resetDependency)
        })
        watchers.push(planWatcher)
        await waitForWatcherReady(planWatcher)
      }
    }
    process.once('SIGTERM', () => {
      void shutdown().finally(() => process.exit(0))
    })
    process.once('SIGINT', () => {
      void shutdown().finally(() => process.exit(0))
    })
    try {
      await pipelineModules
      await prepareScanner(scanner, stylesheetSources, scanPaths())
      await queueWrite()
      await startWatchers()
      process.stderr.write('\nStart watching source changes\n')
    } catch (error) {
      await shutdown()
      throw error
    }
  } else {
    try {
      await pipelineModules
      await prepareScanner(scanner, stylesheetSources, scanPaths())
      await writeOutput()
    } finally {
      await scanner.dispose()
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
