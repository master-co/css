import CSSScanner, { type ScannerOptions } from '@master/css-scanner'
import defaultScannerOptions from '@master/css-scanner/options'
import {
    createStyleCSSHostSource,
    createExtractedCSS as createStylesheetStaticCSS,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import chokidar, { type FSWatcher } from 'chokidar'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { resolveOptions, type Options, type ResolvedOptions } from './options'

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
        scannerOptions: ScannerOptions
        debug: boolean
    }
}

interface StaticSession {
    scanner: CSSScanner
    styleCSSSources: StyleCSSSources
    ready: Promise<CSSScanner>
    write: () => Promise<void>
    watching?: boolean
    watchers: FSWatcher[]
    restarting?: boolean
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

function resolveScannerOptions(options: ResolvedOptions): ScannerOptions {
    const exclude = [
        ...(defaultScannerOptions.exclude || []),
        '**/node_modules/**',
        ...(options.scannerOptions.exclude || [])
    ]
    return {
        ...options.scannerOptions,
        exclude: [...new Set(exclude)],
        verbose: options.scannerOptions.verbose ?? (options.debug ? 1 : 0)
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
    if (!isStyleCSSRequest(resourcePath)) return source
    if (!resolveMasterStyleSource(resourcePath, source, state.projectDir)) return source
    if (isMasterCSSPackageStyleFile(resourcePath, state.projectDir)) {
        return removeMasterStyleDirectives(source).code
    }
    const options = resolveOptions({
        mode: 'static',
        scannerOptions: state.options.scannerOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
    await registerStyleCSSSource(session.scanner, session.styleCSSSources, resourcePath, source, {
        projectDir: state.projectDir
    })
    syncScannerResetDependencies(session)
    await restartStaticWatch(state.projectDir, session)
    await session.write()
    return createStyleCSSHostSource(source, { masterImport: toCSSImportPath(resourcePath, state.outputPath) })
}

async function createStaticCSS(projectDir: string, session: StaticSession) {
    return createStylesheetStaticCSS({
        scanner: session.scanner,
        styleCSSSources: session.styleCSSSources,
        projectDir
    })
}

async function registerStyleCSSEntries(projectDir: string, session: StaticSession) {
    session.styleCSSSources.clear()
    for (const entry of await findCSSManifestEntryFiles(projectDir)) {
        await registerStyleCSSSource(session.scanner, session.styleCSSSources, entry, await readFile(entry, 'utf8'), {
            projectDir
        })
    }
    syncScannerResetDependencies(session)
}

function getStyleDependencyPaths(session: StaticSession) {
    return Array.from(session.styleCSSSources.values()).flatMap((source) => source.dependencies)
}

function syncScannerResetDependencies(session: StaticSession) {
    session.scanner.resetDependencies = [...new Set(getStyleDependencyPaths(session))]
}

async function writeStaticCSS(outputPath: string, cssText: string) {
    await mkdir(dirname(outputPath), { recursive: true })
    try {
        if (await readFile(outputPath, 'utf-8') === cssText) {
            return false
        }
    } catch {
        // File does not exist yet.
    }
    await writeFile(outputPath, cssText)
    return true
}

function createSession(projectDir: string, outputPath: string, options: ResolvedOptions): StaticSession {
    const scanner = new CSSScanner(resolveScannerOptions(options), projectDir)
    const styleCSSSources: StyleCSSSources = new Map()
    let writeChain = Promise.resolve()
    let session: StaticSession
    const write = () => {
        writeChain = writeChain
            .then(async () => {
                const cssText = await createStaticCSS(projectDir, session)
                await writeStaticCSS(outputPath, cssText)
            })
            .catch((error: unknown) => {
                console.error('[@master/css.next] failed to write static CSS:', error)
            })
        return writeChain
    }
    const ready = scanner
        .init()
        .then(async () => {
            await registerStyleCSSEntries(projectDir, session)
            await scanner.prepare()
            await write()
            return scanner
        })

    scanner.on('change', () => {
        void write()
    })

    session = {
        scanner,
        styleCSSSources,
        ready,
        write,
        watchers: []
    }

    return session
}

async function waitForWatcherReady(watcher: FSWatcher) {
    await new Promise<void>((resolve) => watcher.once('ready', resolve))
    // Let chokidar finish registering native watchers before callers mutate files.
    await new Promise((resolve) => setTimeout(resolve, 0))
}

async function closeStaticWatch(session: StaticSession) {
    await Promise.all(session.watchers.splice(0).map((watcher) => watcher.close()))
    session.watching = false
}

function getStaticSourcePaths(scanner: CSSScanner) {
    return scanner.options.required?.length
        ? scanner.fixedSourcePaths
        : scanner.allowedSourcePaths
}

function getStaticResetDependencyPaths(projectDir: string, session: StaticSession) {
    return [...new Set([
        ...getStyleDependencyPaths(session),
        ...session.scanner.resetDependencies
    ])].map((dependency) => resolve(projectDir, dependency))
}

async function startStaticWatch(projectDir: string, session: StaticSession) {
    if (session.watching) return
    session.watching = true
    try {
        const sourcePaths = getStaticSourcePaths(session.scanner)
        if (sourcePaths.length) {
            const sourceWatcher = chokidar.watch(sourcePaths, {
                cwd: projectDir,
                ignoreInitial: true
            })
            const scanSource = (source: string) => {
                const filepath = resolve(projectDir, source)
                if (!existsSync(filepath)) return
                void session.scanner.scanFile(source).catch((error: unknown) => {
                    console.error('[@master/css.next] failed to scan changed source:', error)
                })
            }
            sourceWatcher.on('add', scanSource)
            sourceWatcher.on('change', scanSource)
            session.watchers.push(sourceWatcher)
            await waitForWatcherReady(sourceWatcher)
        }

        const resetDependencyPaths = getStaticResetDependencyPaths(projectDir, session)
        if (resetDependencyPaths.length) {
            const resetWatcher = chokidar.watch(resetDependencyPaths, {
                ignoreInitial: true
            })
            const handleResetDependencyChange = async () => {
                if (session.restarting) return
                session.restarting = true
                try {
                    await closeStaticWatch(session)
                    await session.scanner.reset(session.scanner.customOptions, { prepare: false, emit: false })
                    await registerStyleCSSEntries(projectDir, session)
                    await session.scanner.prepare()
                    await session.write()
                    session.scanner.emit('reset')
                } finally {
                    session.restarting = false
                    await startStaticWatch(projectDir, session)
                }
            }
            const queueReset = () => {
                void handleResetDependencyChange().catch((error: unknown) => {
                    console.error('[@master/css.next] failed to reset static scanner:', error)
                })
            }
            resetWatcher.on('add', queueReset)
            resetWatcher.on('change', queueReset)
            resetWatcher.on('unlink', queueReset)
            session.watchers.push(resetWatcher)
            await waitForWatcherReady(resetWatcher)
        }
    } catch (error) {
        await closeStaticWatch(session)
        throw error
    }
}

async function restartStaticWatch(projectDir: string, session: StaticSession) {
    if (!session.watching || session.restarting) return
    await closeStaticWatch(session)
    await startStaticWatch(projectDir, session)
}

export async function closeNextStaticSessions() {
    const sessions = getSessions()
    await Promise.all(Array.from(sessions.values()).map(closeStaticWatch))
    sessions.clear()
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
    options: ResolvedOptions
) {
    const state: StaticState = {
        version: STATE_VERSION,
        projectDir,
        outputPath,
        scanLogPath,
        options: {
            scannerOptions: resolveScannerOptions(options),
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
        scannerOptions: state.options.scannerOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
    addDependency(state.outputPath)
    for (const styleSource of session.styleCSSSources.values()) {
        for (const dependency of styleSource.dependencies) {
            addDependency(dependency)
        }
    }
}

export async function getOrCreateStaticSession(
    projectDir: string,
    outputPath: string,
    options: ResolvedOptions
) {
    const key = `${projectDir}\0${outputPath}`
    const sessions = getSessions()
    let session = sessions.get(key)
    if (!session) {
        session = createSession(projectDir, outputPath, options)
        sessions.set(key, session)
    }
    await session.ready
    return session
}

export async function prepareNextStatic(rawOptions: Options = {}, setupOptions: PrepareNextStaticOptions = {}) {
    const options = resolveOptions(rawOptions)
    if (options.mode !== 'static') return

    const projectDir = setupOptions.projectDir ?? process.cwd()
    const outputPath = resolveStaticOutputPath(projectDir)
    const statePath = resolveStaticStatePath(outputPath)
    const scanLogPath = resolveStaticScanLogPath(outputPath)
    const session = await getOrCreateStaticSession(projectDir, outputPath, options)

    await writeStaticState(projectDir, outputPath, statePath, scanLogPath, options)

    if (setupOptions.watch && !session.watching) {
        await startStaticWatch(projectDir, session)
    }

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
    const options = resolveOptions({
        mode: 'static',
        scannerOptions: state.options.scannerOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
    await appendScannedSource(state.scanLogPath, resourcePath)
    const changed = await session.scanner.scan(resourcePath, source)
    if (changed) {
        await session.write()
    } else if (!existsSync(state.outputPath)) {
        const cssText = await createStaticCSS(state.projectDir, session)
        await writeStaticCSS(state.outputPath, cssText)
    }
}
