import { publishStaticStylesheets } from './static-publication'
import {
  defaultScannerOptions,
  MasterCSSScanner,
  type MasterCSSScannerOptions,
  type MasterCSSScannerConfiguration
} from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import {
  createStylesheetCollection,
  type MasterCSSStylesheetCollection
} from '@master/css-compiler/stylesheet'
import {
  composeStylesheetHostSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'
import { discoverManifestEntries } from '@master/css-compiler/project'
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { resolveOptions, type MasterCSSNextOptions, type ResolvedMasterCSSNextOptions } from './options'

const STATE_VERSION = 2
const DEFAULT_STATIC_OUTPUT = '.master/next.css'
const DEFAULT_STATE_FILE = 'next-static-state.json'
const DEFAULT_SCAN_LOG_FILE = 'next-static-scanned-sources.log'

export interface StaticState {
  version: 2
  projectDir: string
  outputPath: string
  scanLogPath: string
  options: {
    scanner: MasterCSSScannerConfiguration
    debug: boolean
    pruneNativeCSS: boolean
  }
}

interface StaticSession {
  pruneNativeCSS: boolean
  scanner: MasterCSSScanner
  stylesheets: MasterCSSStylesheetCollection
  ready: Promise<MasterCSSScanner>
  write: () => Promise<void>
  publicationDependencies: readonly string[]
  outputFiles: readonly string[]
  sourceDependencies: readonly string[]
}

interface PrepareNextStaticOptions {
  projectDir?: string
  watch?: boolean
}

declare global {
  var __MASTER_CSS_NEXT_STATIC_SESSIONS__: Map<string, StaticSession> | undefined
}

function getSessions() {
  return globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ ??= new Map()
}

function resolveScannerOptions(options: ResolvedMasterCSSNextOptions): MasterCSSScannerOptions {
  const exclude = [
    ...(defaultScannerOptions.exclude || []),
    '**/node_modules/**',
    '**/.master/**',
    ...(options.scanner.exclude || [])
  ]
  return {
    manifest: defaultBuildManifest,
    ...options.scanner,
    exclude: [...new Set(exclude)],
    verbose: options.scanner.verbose ?? (options.debug ? 1 : 0)
  }
}

function toCSSImportPath(fromFile: string, toFile: string) {
  let importPath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath
  }
  return importPath
}

export async function transformStaticStyleSource(statePath: string, resourcePath: string, source: string) {
  const state = readStaticState(statePath)
  const resolution = resolveStylesheetSync(resourcePath, source, {
    projectDir: state.projectDir,
    // Classify on the import graph. Flattening refuses shapes this loader then
    // compiles happily through the delivery path, and misses local directives
    // an imported file declares.
    preserveImports: true
  })
  if (!resolution || (resolution.kind !== 'entry' && resolution.kind !== 'master-package-entry')) return source
  if (resolution.kind === 'master-package-entry') {
    return resolution.outputSource
  }
  const options = resolveOptions({
    mode: 'static',
    scanner: state.options.scanner,
    pruneNativeCSS: state.options.pruneNativeCSS,
    debug: state.options.debug
  })
  const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
  await session.stylesheets.register(session.scanner, resourcePath, source, {
    baseManifest: session.scanner.css.manifest,
    projectDir: state.projectDir,
    pruneNativeCSS: session.pruneNativeCSS
  })
  syncScannerResetDependencies(session)
  await session.write()
  return composeStylesheetHostSync(source, { masterImport: toCSSImportPath(resourcePath, state.outputPath) })
}

async function publishStaticCSS(projectDir: string, outputPath: string, session: StaticSession) {
  const result = await publishStaticStylesheets(outputPath, delivery => session.stylesheets.compose({
    scanner: session.scanner,
    baseManifest: session.scanner.css.manifest,
    projectDir,
    pruneNativeCSS: session.pruneNativeCSS,
    delivery
  }))
  session.publicationDependencies = result.dependencies
  session.outputFiles = result.outputFiles
  syncScannerResetDependencies(session)
}

async function registerStylesheetEntries(projectDir: string, session: StaticSession) {
  session.stylesheets.clear()
  for (const entry of await discoverManifestEntries({ root: projectDir })) {
    await session.stylesheets.register(session.scanner, entry, await readFile(entry, 'utf8'), {
      baseManifest: session.scanner.css.manifest,
      projectDir,
      pruneNativeCSS: session.pruneNativeCSS
    })
  }
  syncScannerResetDependencies(session)
}

function getStyleDependencyPaths(session: StaticSession) {
  return [...session.stylesheets.snapshot().dependencies, ...session.publicationDependencies]
}

function syncScannerResetDependencies(session: StaticSession) {
  session.scanner.resetDependencies = [...new Set(getStyleDependencyPaths(session))]
}

async function scanProjectSources(projectDir: string, session: StaticSession) {
  // Loaders run in independent processes. Every publisher needs the complete
  // project (including MDX), otherwise a new worker can replace CSS with only
  // its own subset of modules. Extraction remains owned by the scanner.
  const sources: string[] = []
  for await (const source of glob('**/*', {
    cwd: projectDir,
    exclude: [...(session.scanner.options.exclude || [])],
    withFileTypes: true
  })) {
    if (!source.isFile()) continue
    const path = resolve(source.parentPath, source.name)
    if (session.scanner.isModuleAllowed(path)) sources.push(path)
  }
  for (const source of sources.sort()) {
    await session.scanner.scanModule(source, await readFile(source, 'utf8'))
  }
  session.sourceDependencies = sources
}

function createSession(projectDir: string, outputPath: string, options: ResolvedMasterCSSNextOptions): StaticSession {
  const scanner = new MasterCSSScanner(resolveScannerOptions(options), projectDir)
  const stylesheets = createStylesheetCollection()
  let writeChain = Promise.resolve()
  let session: StaticSession
  const write = () => {
    // Explicit operations reject; subsequent queued attempts can still recover.
    writeChain = writeChain.catch(() => undefined).then(async () => {
      await scanProjectSources(projectDir, session)
      await publishStaticCSS(projectDir, outputPath, session)
    })
    return writeChain
  }
  const ready = scanner
    .init()
    .then(async () => {
      await registerStylesheetEntries(projectDir, session)
      await write()
      return scanner
    })

  session = {
    pruneNativeCSS: options.pruneNativeCSS,
    scanner,
    stylesheets,
    ready,
    write,
    publicationDependencies: [],
    outputFiles: [],
    sourceDependencies: []
  }

  return session
}

export function resolveStaticOutputPath(projectDir: string) {
  return resolve(projectDir, DEFAULT_STATIC_OUTPUT)
}

export function resolveStaticStatePath(outputPath: string) {
  return resolve(dirname(outputPath), DEFAULT_STATE_FILE)
}

export function resolveStaticScanLogPath(outputPath: string) {
  return resolve(dirname(outputPath), DEFAULT_SCAN_LOG_FILE)
}

export async function writeStaticState(
  projectDir: string,
  outputPath: string,
  statePath: string,
  scanLogPath: string,
  options: ResolvedMasterCSSNextOptions
) {
  const state: StaticState = {
    version: STATE_VERSION,
    projectDir,
    outputPath,
    scanLogPath,
    options: {
      scanner: resolveScannerOptions(options),
      pruneNativeCSS: options.pruneNativeCSS,
      debug: options.debug
    }
  }
  await mkdir(dirname(statePath), { recursive: true })
  await writeFile(statePath, JSON.stringify(state, null, 2))
}

export function readStaticState(statePath: string): StaticState {
  const state = JSON.parse(readFileSync(statePath, 'utf-8')) as StaticState
  if (state.version !== STATE_VERSION) {
    throw new Error(`Unsupported Master CSS Next static state version: ${String(state.version)}`)
  }
  return state
}

export async function addStaticCSSDependencies(statePath: string, addDependency?: (file: string) => void) {
  if (!addDependency) return
  const state = readStaticState(statePath)
  const options = resolveOptions({
    mode: 'static',
    scanner: state.options.scanner,
    pruneNativeCSS: state.options.pruneNativeCSS,
    debug: state.options.debug
  })
  const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
  for (const file of new Set([state.outputPath, ...session.outputFiles, ...session.publicationDependencies, ...session.sourceDependencies])) addDependency(file)
  for (const styleSource of session.stylesheets.snapshot().sources) {
    for (const dependency of styleSource.dependencies) {
      addDependency(dependency)
    }
  }
}

export async function getOrCreateStaticSession(
  projectDir: string,
  outputPath: string,
  options: ResolvedMasterCSSNextOptions
) {
  const key = `${projectDir}\0${outputPath}`
  const sessions = getSessions()
  let session = sessions.get(key)
  if (!session) {
    session = createSession(projectDir, outputPath, options)
    sessions.set(key, session)
  }
  try { await session.ready }
  catch (error) {
    if (sessions.get(key) === session) {
      sessions.delete(key)
      await session.scanner.dispose()
      session.stylesheets.dispose()
    }
    throw error
  }
  return session
}

export async function prepareNextStatic(rawOptions: MasterCSSNextOptions = {}, setupOptions: PrepareNextStaticOptions = {}) {
  const options = resolveOptions(rawOptions)
  if (options.mode !== 'static') return

  const projectDir = setupOptions.projectDir ?? process.cwd()
  const outputPath = resolveStaticOutputPath(projectDir)
  const statePath = resolveStaticStatePath(outputPath)
  const scanLogPath = resolveStaticScanLogPath(outputPath)
  const session = await getOrCreateStaticSession(projectDir, outputPath, options)

  await writeStaticState(projectDir, outputPath, statePath, scanLogPath, options)

  return {
    projectDir,
    outputPath,
    statePath,
    scanLogPath
  }
}

function appendScannedSource(scanLogPath: string, resourcePath: string) {
  const existing = existsSync(scanLogPath)
    ? new Set(readFileSync(scanLogPath, 'utf-8').split(/\r?\n/).filter(Boolean))
    : new Set<string>()
  if (existing.has(resourcePath)) return Promise.resolve()
  existing.add(resourcePath)
  return writeFile(scanLogPath, Array.from(existing).sort().join('\n') + '\n')
}

export async function scanStaticModule(statePath: string, resourcePath: string, source: string) {
  const state = readStaticState(statePath)
  const projectPath = relative(state.projectDir, resourcePath)
  if (projectPath === '..' || projectPath.startsWith('../') || projectPath.startsWith('..\\')) return
  const options = resolveOptions({
    mode: 'static',
    scanner: state.options.scanner,
    pruneNativeCSS: state.options.pruneNativeCSS,
    debug: state.options.debug
  })
  const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
  await appendScannedSource(state.scanLogPath, resourcePath)
  const changed = await session.scanner.scanModule(resourcePath, source)
  if (changed) {
    await session.write()
  } else if (!existsSync(state.outputPath)) {
    await session.write()
  }
}
