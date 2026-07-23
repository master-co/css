import type { ScannerOptions } from '@master/css-tooling/scanner'
import type CSSScanner from '@master/css-tooling/scanner'
import type { StyleCSSSources } from '@master/css-compiler/stylesheet'
import type { FSWatcher } from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_SCAN_OUTPUT } from './constants'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
type FastGlob = Pick<typeof import('fast-glob'), 'sync'>
type Chokidar = typeof import('chokidar').default
type Logger = ReturnType<typeof import('consola').createConsola>
type Bytes = (value: number) => string
type CSSScannerConstructor = typeof import('@master/css-tooling/scanner').default
type StylesheetModule = typeof import('@master/css-compiler/stylesheet')
type ProjectEntriesModule = typeof import('@master/css-compiler/project/entries')

let scannerModulePromise: Promise<CSSScannerConstructor> | undefined
let stylesheetModulePromise: Promise<StylesheetModule> | undefined
let projectEntriesModulePromise: Promise<ProjectEntriesModule> | undefined
let fastGlobModulePromise: Promise<FastGlob> | undefined
let chokidarModulePromise: Promise<Chokidar> | undefined
let loggerPromise: Promise<Logger> | undefined
let bytesPromise: Promise<Bytes> | undefined

export interface ScanOptions {
  watch?: boolean
  output?: string
  verbose?: string | number
  export?: boolean
  cwd?: string
  backend?: 'auto' | 'native' | 'wasm'
}

async function registerManagedCSSEntries(scanner: CSSScanner, styleCSSSources: StyleCSSSources) {
  const [
    { registerStyleCSSSource },
    { findCSSManifestEntryFiles }
  ] = await Promise.all([
    loadStylesheetModule(),
    loadProjectEntriesModule()
  ])
  styleCSSSources.clear()
  for (const entry of await findCSSManifestEntryFiles(scanner.cwd)) {
    await registerStyleCSSSource(scanner, styleCSSSources, entry, fs.readFileSync(entry, 'utf8'), {
      projectDir: scanner.cwd
    })
  }
  scanner.resetDependencies = [...new Set(
    Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
  )]
}

function normalizeSourcePatterns(specifiedSourcePaths?: string[]) {
  return specifiedSourcePaths?.length ? specifiedSourcePaths : DEFAULT_SOURCE_PATTERNS
}

function normalizeGlobPatterns(patterns: string[]) {
  return patterns.map((pattern) => pattern.replace(/\\/g, '/'))
}

function resolveSourcePaths(scanner: CSSScanner, fg: FastGlob, sourcePatterns: string[], ignore: string[] = []) {
  return fg.sync(normalizeGlobPatterns(sourcePatterns), {
    cwd: scanner.cwd,
    ignore: normalizeGlobPatterns(ignore)
  })
    .filter(Boolean)
}

async function scanSourceFile(scanner: CSSScanner, source: string) {
  const filepath = path.resolve(scanner.cwd, source)
  await scanner.scan(source, fs.readFileSync(filepath, 'utf8'))
}

async function scanSourceFiles(scanner: CSSScanner, sourcePaths: string[]) {
  await Promise.all(sourcePaths.map((source) => scanSourceFile(scanner, source)))
}

async function prepareScanner(scanner: CSSScanner, styleCSSSources: StyleCSSSources, sourcePaths: string[]) {
  await registerManagedCSSEntries(scanner, styleCSSSources)
  await scanSourceFiles(scanner, sourcePaths)
}

async function exportCSS(scanner: CSSScanner, css: string, filename = DEFAULT_SCAN_OUTPUT) {
  const filepath = path.resolve(scanner.cwd, filename)
  const dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filepath, css)
  if (scanner.options.verbose) {
    const [logger, bytes] = await Promise.all([
      loadLogger(),
      loadBytes()
    ])
    logger.success(`${filename} exported ${bytes(css.length)}`)
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

export default async function runScan(specifiedSourcePaths: string[] = [], options: ScanOptions = {}) {
  const pipelineModules = Promise.all([
    loadStylesheetModule(),
    loadProjectEntriesModule()
  ])
  const [
    CSSScanner,
    fg
  ] = await Promise.all([
    loadCSSScanner(),
    loadFastGlob()
  ])
  const { watch, output, verbose, cwd } = options
  const scanner = new CSSScanner({}, cwd)
  const styleCSSSources: StyleCSSSources = new Map()
  const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
  const writeOutput = async () => {
    const { createExtractedCSS } = await loadStylesheetModule()
    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: scanner.cwd
    })
    if (options.export) {
      await exportCSS(scanner, css, output)
    } else {
      console.log(css)
    }
  }
  scanner.on('init', (options: ScannerOptions) => {
    if (!specifiedSourcePaths.length) {
      if (!options.exclude?.includes('**/node_modules/**')) {
        options.exclude?.push('**/node_modules/**')
      }
      if (!options.exclude?.includes('node_modules')) {
        options.exclude?.push('node_modules')
      }
    }
    options.verbose = verbose ? +verbose : options.verbose
  })
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
              const logger = await loadLogger()
              logger.log('')
              logger.info(`[change] ${formatWatchedPath(scanner.cwd, resetDependency)}`)
            }
            await closeWatchers()
            await scanner.reset(scanner.customOptions, { emit: false })
            await prepareScanner(scanner, styleCSSSources, scanPaths())
            await queueWrite()
            await startWatchers()
            const logger = await loadLogger()
            logger.log('')
            logger.info('Restart watching source changes')
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
      void closeWatchers().finally(() => process.exit(0))
    })
    process.once('SIGINT', () => {
      void closeWatchers().finally(() => process.exit(0))
    })
    await pipelineModules
    await prepareScanner(scanner, styleCSSSources, scanPaths())
    await queueWrite()
    await startWatchers()
    const logger = await loadLogger()
    logger.log('')
    logger.info('Start watching source changes')
  } else {
    await pipelineModules
    await prepareScanner(scanner, styleCSSSources, scanPaths())
    await writeOutput()
  }
}

function loadCSSScanner() {
  scannerModulePromise ||= import('@master/css-tooling/scanner').then((mod) => mod.default)
  return scannerModulePromise
}

function loadStylesheetModule() {
  stylesheetModulePromise ||= import('@master/css-compiler/stylesheet')
  return stylesheetModulePromise
}

function loadProjectEntriesModule() {
  projectEntriesModulePromise ||= import('@master/css-compiler/project/entries')
  return projectEntriesModulePromise
}

function loadFastGlob() {
  fastGlobModulePromise ||= import('fast-glob').then((mod) => mod.default || mod)
  return fastGlobModulePromise
}

function loadChokidar() {
  chokidarModulePromise ||= import('chokidar').then((mod) => mod.default)
  return chokidarModulePromise
}

function loadLogger() {
  loggerPromise ||= import('consola').then(({ createConsola }) => createConsola({ level: 3 }))
  return loggerPromise
}

function loadBytes() {
  bytesPromise ||= import('bytes').then((mod) => (mod as unknown as { default?: Bytes }).default || mod as unknown as Bytes)
  return bytesPromise
}
