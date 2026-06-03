import CSSExtractor, { type Options as ExtractorOptions } from '@master/css-extractor'
import defaultExtractorOptions from '@master/css-extractor/options'
import type { Config } from 'shared/css-config'
import {
    createStyleCSSHostSource,
    createExtractedCSS as createExtractorExtractedCSS,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-extractor/style'
import { findCSSConfigEntryFiles } from '@master/css-configer/css'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { resolveOptions, type Options, type ResolvedOptions } from './options'

const STATE_VERSION = 1
const DEFAULT_EXTRACT_OUTPUT = '.master/next.css'
const DEFAULT_STATE_FILE = 'next-extract-state.json'
const DEFAULT_SCAN_LOG_FILE = 'next-extract-scanned-sources.log'

export interface ExtractState {
    version: 1
    projectDir: string
    outputPath: string
    scanLogPath: string
    options: {
        config?: Config
        extractorOptions: ExtractorOptions
        debug: boolean
    }
}

interface ExtractSession {
    extractor: CSSExtractor
    styleCSSSources: StyleCSSSources
    ready: Promise<CSSExtractor>
    write: () => Promise<void>
    watching?: boolean
}

interface PrepareNextExtractOptions {
    projectDir?: string
    watch?: boolean
}

declare global {
    var __MASTER_CSS_NEXT_EXTRACT_SESSIONS__: Map<string, ExtractSession> | undefined
}

function getSessions() {
    return globalThis.__MASTER_CSS_NEXT_EXTRACT_SESSIONS__ ??= new Map()
}

function resolveExtractorOptions(options: ResolvedOptions): ExtractorOptions {
    const exclude = [
        ...(defaultExtractorOptions.exclude || []),
        '**/node_modules/**',
        ...(options.extractorOptions.exclude || [])
    ]
    return {
        ...options.extractorOptions,
        config: options.extractorOptions.config ?? options.config,
        exclude: [...new Set(exclude)],
        output: DEFAULT_EXTRACT_OUTPUT,
        verbose: options.extractorOptions.verbose ?? (options.debug ? 1 : 0)
    }
}

function toCSSImportPath(fromFile: string, toFile: string) {
    let importPath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
    if (!importPath.startsWith('.')) {
        importPath = './' + importPath
    }
    return importPath
}

export async function transformExtractStyleSource(statePath: string, resourcePath: string, source: string) {
    const state = readExtractState(statePath)
    if (!isStyleCSSRequest(resourcePath)) return source
    if (!resolveMasterStyleSource(resourcePath, source, state.projectDir)) return source
    if (isMasterCSSPackageStyleFile(resourcePath, state.projectDir)) {
        return removeMasterStyleDirectives(source).code
    }
    const options = resolveOptions({
        mode: 'extract',
        config: state.options.config,
        extractorOptions: state.options.extractorOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateExtractSession(state.projectDir, state.outputPath, options)
    await registerStyleCSSSource(session.extractor, session.styleCSSSources, resourcePath, source, {
        projectDir: state.projectDir
    })
    await session.write()
    return createStyleCSSHostSource(source, { masterImport: toCSSImportPath(resourcePath, state.outputPath) })
}

async function createExtractedCSS(projectDir: string, session: ExtractSession) {
    return createExtractorExtractedCSS({
        extractor: session.extractor,
        styleCSSSources: session.styleCSSSources,
        projectDir
    })
}

async function registerStyleCSSEntries(projectDir: string, session: ExtractSession) {
    for (const entry of await findCSSConfigEntryFiles(projectDir)) {
        await registerStyleCSSSource(session.extractor, session.styleCSSSources, entry, await readFile(entry, 'utf8'), {
            projectDir
        })
    }
}

async function writeExtractedCSS(outputPath: string, cssText: string) {
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

function createSession(projectDir: string, outputPath: string, options: ResolvedOptions): ExtractSession {
    const extractor = new CSSExtractor(resolveExtractorOptions(options), projectDir)
    const styleCSSSources: StyleCSSSources = new Map()
    let writeChain = Promise.resolve()
    let session: ExtractSession
    const write = () => {
        writeChain = writeChain
            .then(async () => {
                const cssText = await createExtractedCSS(projectDir, session)
                await writeExtractedCSS(outputPath, cssText)
            })
            .catch((error: unknown) => {
                console.error('[@master/css.next] failed to write extracted CSS:', error)
            })
        return writeChain
    }
    const ready = extractor
        .init()
        .then(async () => {
            await registerStyleCSSEntries(projectDir, session)
            await extractor.prepare()
            await write()
            return extractor
        })

    extractor.on('change', () => {
        void write()
    })
    extractor.on('reset', () => {
        void write()
    })

    session = {
        extractor,
        styleCSSSources,
        ready,
        write
    }

    return session
}

export function resolveExtractOutputPath(projectDir: string) {
    return resolve(projectDir, DEFAULT_EXTRACT_OUTPUT)
}

export function resolveExtractStatePath(outputPath: string) {
    return resolve(dirname(outputPath), DEFAULT_STATE_FILE)
}

export function resolveExtractScanLogPath(outputPath: string) {
    return resolve(dirname(outputPath), DEFAULT_SCAN_LOG_FILE)
}

export async function writeExtractState(
    projectDir: string,
    outputPath: string,
    statePath: string,
    scanLogPath: string,
    options: ResolvedOptions
) {
    const state: ExtractState = {
        version: STATE_VERSION,
        projectDir,
        outputPath,
        scanLogPath,
        options: {
            config: options.config,
            extractorOptions: resolveExtractorOptions(options),
            debug: options.debug
        }
    }
    await mkdir(dirname(statePath), { recursive: true })
    await writeFile(statePath, JSON.stringify(state, null, 2))
}

export function readExtractState(statePath: string): ExtractState {
    const state = JSON.parse(readFileSync(statePath, 'utf-8')) as ExtractState
    if (state.version !== STATE_VERSION) {
        throw new Error(`Unsupported Master CSS Next extract state version: ${String(state.version)}`)
    }
    return state
}

export async function addExtractCSSDependencies(statePath: string, addDependency?: (file: string) => void) {
    if (!addDependency) return
    const state = readExtractState(statePath)
    const options = resolveOptions({
        mode: 'extract',
        config: state.options.config,
        extractorOptions: state.options.extractorOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateExtractSession(state.projectDir, state.outputPath, options)
    addDependency(state.outputPath)
    for (const styleSource of session.styleCSSSources.values()) {
        for (const dependency of styleSource.dependencies) {
            addDependency(dependency)
        }
    }
}

export async function getOrCreateExtractSession(
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

export async function prepareNextExtract(rawOptions: Options = {}, setupOptions: PrepareNextExtractOptions = {}) {
    const options = resolveOptions(rawOptions)
    if (options.mode !== 'extract') return

    const projectDir = setupOptions.projectDir ?? process.cwd()
    const outputPath = resolveExtractOutputPath(projectDir)
    const statePath = resolveExtractStatePath(outputPath)
    const scanLogPath = resolveExtractScanLogPath(outputPath)
    const session = await getOrCreateExtractSession(projectDir, outputPath, options)

    await writeExtractState(projectDir, outputPath, statePath, scanLogPath, options)

    if (setupOptions.watch && !session.watching) {
        await session.extractor.startWatch()
        session.watching = true
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

export async function scanExtractModule(statePath: string, resourcePath: string, source: string) {
    const state = readExtractState(statePath)
    const options = resolveOptions({
        mode: 'extract',
        config: state.options.config,
        extractorOptions: state.options.extractorOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateExtractSession(state.projectDir, state.outputPath, options)
    await appendScannedSource(state.scanLogPath, resourcePath)
    const changed = await session.extractor.insert(resourcePath, source)
    if (changed) {
        await session.write()
    } else if (!existsSync(state.outputPath)) {
        const cssText = await createExtractedCSS(state.projectDir, session)
        await writeExtractedCSS(state.outputPath, cssText)
    }
}
