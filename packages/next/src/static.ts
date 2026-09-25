import { captureStaticSnapshot, type StaticSnapshot } from './static-snapshot'
import { createStaticQueue } from './static-queue'
import { readStaticPublication, staticOutputsMatch, staticProducerFingerprint, writeStaticPublication } from './static-cache'
import { captureStaticStyleInput, loadStaticStyleInputs, type StaticStyleInput } from './static-inputs'
import { serializeStaticOptions, deserializeStaticOptions, staticFingerprint } from './static-state'
import { withStaticPublicationLock } from './static-lock'
import { publishStaticStylesheets, publishFile } from './static-publication'
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
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { resolveOptions, type MasterCSSNextOptions, type ResolvedMasterCSSNextOptions } from './options'

const STATE_VERSION = 3
const DEFAULT_STATIC_OUTPUT = '.master/next.css'
const DEFAULT_STATE_FILE = 'next-static-state.json'
const DEFAULT_SCAN_LOG_FILE = 'next-static-scanned-sources.log'

export interface StaticState {
  version: 3
  fingerprint: string
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
  write: (input?: StaticStyleInput) => Promise<void>
  publicationDependencies: readonly string[]
  outputFiles: readonly string[]
  sourceDependencies: readonly string[]
  preprocessorDependencies: readonly string[]
  stylesheetFingerprint?: string
  policyFingerprint?: string
  requiresRediscovery?: boolean
}

interface PrepareNextStaticOptions {
  projectDir?: string
  watch?: boolean
  distDir?: string
}

declare global {
  var __MASTER_CSS_NEXT_STATIC_SESSIONS__: Map<string, StaticSession> | undefined
}

function getSessions() {
  return globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ ??= new Map()
}

function resolveScannerOptions(options: ResolvedMasterCSSNextOptions): MasterCSSScannerOptions {
  return {
    manifest: defaultBuildManifest,
    ...options.scanner,
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

export async function transformStaticStyleSource(statePath: string, resourcePath: string, source: string, dependencies: readonly string[] = []) {
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
  const input = await captureStaticStyleInput(resourcePath, source, dependencies)
  const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
  await session.write(input)
  return composeStylesheetHostSync(source, { masterImport: toCSSImportPath(resourcePath, state.outputPath) })
}

async function publishStaticCSS(projectDir: string, outputPath: string, session: StaticSession, verifySnapshot: (dependencies: readonly string[]) => Promise<void>, repair?: ReadonlyMap<string, string>) {
  const result = await publishStaticStylesheets(outputPath, delivery => session.stylesheets.compose({
    scanner: session.scanner,
    baseManifest: session.scanner.css.manifest,
    projectDir,
    pruneNativeCSS: session.pruneNativeCSS,
    delivery
  }), verifySnapshot, repair)
  session.publicationDependencies = result.dependencies
  session.outputFiles = result.outputFiles
  syncScannerResetDependencies(session)
  return result
}

function stylesheetFingerprint(snapshot: StaticSnapshot, session: StaticSession, inputs: Record<string, StaticStyleInput>) {
  return staticFingerprint({
    entries: snapshot.entries, resolutions: snapshot.resolutions, inputs,
    manifest: session.scanner.css.manifest,
    files: [...new Set([...snapshot.entries, ...snapshot.resolutions.flatMap(item => item.dependencies), ...Object.keys(inputs), ...session.stylesheets.snapshot().dependencies, ...session.preprocessorDependencies])].sort()
      .map(file => [file, snapshot.hashes.get(file) ?? null])
  })
}

async function registerStylesheetEntries(projectDir: string, session: StaticSession, inputs: Record<string, StaticStyleInput>, snapshot: StaticSnapshot) {
  const fingerprint = stylesheetFingerprint(snapshot, session, inputs)
  if (session.stylesheetFingerprint === fingerprint) return
  session.stylesheetFingerprint = undefined
  session.stylesheets.clear()
  session.requiresRediscovery = snapshot.resolutions.some(resolution => resolution.hasReferences)
  for (const entry of new Set([...snapshot.entries, ...Object.keys(inputs)])) {
    const source = inputs[entry]?.source ?? snapshot.contents.get(entry)?.toString('utf8')
    if (source === undefined) throw new SnapshotChangedError()
    const result = await session.stylesheets.register(session.scanner, entry, source, {
      baseManifest: session.scanner.css.manifest, projectDir, pruneNativeCSS: session.pruneNativeCSS
    })
    // Explicit source globs can introduce inputs outside the automatic inventory.
    // Until their discovery is shared by the compiler, never reuse that publication.
    session.requiresRediscovery ||= result.directiveSummary.extractionPolicy.include.length > 0
  }
  syncScannerResetDependencies(session)
}

function getStyleDependencyPaths(session: StaticSession) {
  return [...session.stylesheets.snapshot().dependencies, ...session.publicationDependencies, ...session.preprocessorDependencies]
}

function syncScannerResetDependencies(session: StaticSession) {
  session.scanner.resetDependencies = [...new Set(getStyleDependencyPaths(session))]
}

function scanProjectSources(projectDir: string, session: StaticSession, inputs: Record<string, StaticStyleInput>) {
  return captureStaticSnapshot(projectDir, session.scanner, getStyleDependencyPaths(session), inputs)
}

function createSession(projectDir: string, outputPath: string, options: ResolvedMasterCSSNextOptions): StaticSession {
  const scanner = new MasterCSSScanner(resolveScannerOptions(options), projectDir)
  const stylesheets = createStylesheetCollection()
  const configuration = staticFingerprint(resolveScannerStateOptions(options))
  const producer = staticProducerFingerprint()
  let session: StaticSession
  const write = createStaticQueue<StaticStyleInput>(async (input, captured) => {
    await withStaticPublicationLock(resolve(dirname(outputPath), 'publish.lock'), async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const assertCurrentConfiguration = () => {
            const statePath = resolveStaticStatePath(outputPath)
            if (staticFingerprint(resolveScannerStateOptions(options)) !== configuration
              || (existsSync(statePath) && readStaticState(statePath).fingerprint !== configuration)) throw new Error('Master CSS configuration changed during compilation. Retry with the current static state.')
          }
          assertCurrentConfiguration()
          const inputs = await loadStaticStyleInputs(outputPath, configuration, input)
          const record = await readStaticPublication(outputPath, producer)
          session.preprocessorDependencies = [...new Set(Object.values(inputs).flatMap(input => [input.file, ...Object.keys(input.dependencies)]))]
          if (record) session.publicationDependencies = [...new Set([...session.publicationDependencies, ...record.dependencies])]
          // Close this notification batch before reading: later requests need a fresh round.
          captured()
          let before = await scanProjectSources(projectDir, session, inputs)
          const policyFingerprint = staticFingerprint([...before.hashes].filter(([file]) => basename(file) === '.gitignore'))
          if (session.policyFingerprint !== undefined && session.policyFingerprint !== policyFingerprint) {
            // SourcePolicy's metadata cache must not hide same-mtime ignore edits.
            await session.scanner.reset()
            session.stylesheets.clear()
            session.stylesheetFingerprint = undefined
            before = await scanProjectSources(projectDir, session, inputs)
          }
          session.policyFingerprint = staticFingerprint([...before.hashes].filter(([file]) => basename(file) === '.gitignore'))
          const identity = (snapshot: StaticSnapshot) => staticFingerprint({ producer, configuration, inputs, snapshot: snapshot.fingerprint })
          if (record?.reusable && record.fingerprint === identity(before) && await staticOutputsMatch(record)) {
            assertCurrentConfiguration()
            const verified = await scanProjectSources(projectDir, session, inputs)
            if (before.fingerprint !== verified.fingerprint) throw new SnapshotChangedError()
            assertCurrentConfiguration()
            session.sourceDependencies = verified.sources
            session.outputFiles = record.outputs.map(([file]) => file)
            syncScannerResetDependencies(session)
            return
          }
          await registerStylesheetEntries(projectDir, session, inputs, before)
          const snapshot = await scanProjectSources(projectDir, session, inputs)
          if (before.fingerprint !== snapshot.fingerprint) throw new SnapshotChangedError()
          session.stylesheetFingerprint = session.requiresRediscovery ? undefined : stylesheetFingerprint(snapshot, session, inputs)
          await session.scanner.reconcileSources('project', snapshot.sources.map(source => ({ source, content: snapshot.contents.get(source)!.toString('utf8') })))
          session.sourceDependencies = snapshot.sources
          const result = await publishStaticCSS(projectDir, outputPath, session, async dependencies => {
            // Delivery can discover resources not seen by stylesheet registration.
            session.publicationDependencies = [...new Set([...session.publicationDependencies, ...dependencies])]
            assertCurrentConfiguration()
            if ((await scanProjectSources(projectDir, session, inputs)).fingerprint !== snapshot.fingerprint) throw new SnapshotChangedError()
            assertCurrentConfiguration()
          }, record && new Map(record.outputs))
          const sourceSet = new Set(snapshot.sources)
          await writeStaticPublication(outputPath, {
            version: 1, producer, fingerprint: identity(snapshot), reusable: !session.requiresRediscovery,
            dependencies: snapshot.dependencies.filter(file => !sourceSet.has(file)), outputs: result.outputs
          })
          return
        } catch (error) {
          session.stylesheetFingerprint = undefined
          if (!(error instanceof SnapshotChangedError) && !['ENOENT', 'MASTER_SNAPSHOT_CHANGED'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error
          if (attempt === 2) throw new Error('Master CSS sources changed repeatedly during compilation. No new entry was published.', { cause: error })
        }
      }
    })
  })
  const ready = scanner
    .init()
    .then(async () => {
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
    sourceDependencies: [],
    preprocessorDependencies: []
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

class SnapshotChangedError extends Error {}
function resolveScannerStateOptions(options: ResolvedMasterCSSNextOptions) {
  return { scanner: resolveScannerOptions(options), pruneNativeCSS: options.pruneNativeCSS, debug: options.debug }
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
    fingerprint: staticFingerprint(resolveScannerStateOptions(options)),
    options: resolveScannerStateOptions(options)
  }
  await mkdir(dirname(statePath), { recursive: true })
  await publishFile(statePath, Buffer.from(serializeStaticOptions(state)), false)
}

export function readStaticState(statePath: string): StaticState {
  const state = deserializeStaticOptions<StaticState>(readFileSync(statePath, 'utf-8'))
  if (state.version !== STATE_VERSION) {
    throw new Error(`Unsupported Master CSS Next static state version: ${String(state.version)}`)
  }
  return state
}

export async function addStaticCSSDependencies(statePath: string, addDependency?: (file: string) => void,
  addContextDependency?: (directory: string) => void, addMissingDependency?: (file: string) => void) {
  if (!addDependency && !addContextDependency) return
  const state = readStaticState(statePath)
  const options = resolveOptions({
    mode: 'static',
    scanner: state.options.scanner,
    pruneNativeCSS: state.options.pruneNativeCSS,
    debug: state.options.debug
  })
  const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
  addDependency?.(statePath)
  const output = new Set(session.outputFiles)
  for (const file of new Set([...session.publicationDependencies, ...session.preprocessorDependencies, ...session.sourceDependencies, ...session.scanner.sourcePolicyDependencies])) {
    if (output.has(file)) continue
    if (existsSync(file)) addDependency?.(file)
    else addMissingDependency?.(file)
  }
  // Context dependencies detect additions, deletions and renames. Ignore/output
  // policies keep generated files out of the scanner even when a host rebuilds.
  const directories = new Set([state.projectDir, ...session.sourceDependencies.map(dirname)])
  for (const directory of directories) addContextDependency?.(directory)
  for (const styleSource of session.stylesheets.snapshot().sources) {
    for (const dependency of styleSource.dependencies) {
      if (!output.has(dependency)) addDependency?.(dependency)
    }
  }
}

export async function getOrCreateStaticSession(
  projectDir: string,
  outputPath: string,
  options: ResolvedMasterCSSNextOptions
) {
  const key = `${projectDir}\0${outputPath}\0${staticFingerprint(resolveScannerStateOptions(options))}`
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
  options.scanner.outputDirectories = [...(options.scanner.outputDirectories ?? []), resolve(projectDir, setupOptions.distDir ?? '.next')]
  await writeStaticState(projectDir, outputPath, statePath, scanLogPath, options)
  await getOrCreateStaticSession(projectDir, outputPath, options)

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

export async function scanStaticModule(statePath: string, resourcePath: string, _source: string) {
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
  // Every worker publishes the same original source snapshot. Loader-transformed
  // display strings must never become a second owner of MDX/Vue/Svelte content.
  await session.write()
}
