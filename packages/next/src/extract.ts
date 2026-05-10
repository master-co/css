import CSSExtractor, { type Options as ExtractorOptions } from '@master/css-extractor'
import defaultExtractorOptions from '@master/css-extractor/options'
import { type Config } from '@master/css'
import {
    createExtractedCSS as createExtractorExtractedCSS,
    isMasterStyleSource,
    isStyleCSSRequest,
    registerStyleCSSSource
} from '@master/css-extractor/style'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { resolveOptions, type Options, type ResolvedOptions } from './options'

const STATE_VERSION = 1
const DEFAULT_EXTRACT_OUTPUT = '.master-css/next.css'
const DEFAULT_STATE_FILE = 'next-extract-state.json'
const DEFAULT_SCAN_LOG_FILE = 'next-extract-scanned-sources.log'

export interface ExtractState {
    version: 1
    projectDir: string
    outputPath: string
    scanLogPath: string
    options: {
        config: string | Config
        extractorOptions: ExtractorOptions
        module: string
        debug: boolean
    }
}

interface ExtractSession {
    extractor: CSSExtractor
    ready: Promise<CSSExtractor>
    write: () => Promise<void>
    styleCSSSources: Map<string, string>
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
        module: options.module,
        output: DEFAULT_EXTRACT_OUTPUT,
        verbose: options.extractorOptions.verbose ?? (options.debug ? 1 : 0)
    }
}

export async function transformExtractStyleSource(statePath: string, resourcePath: string, source: string) {
    const state = readExtractState(statePath)
    if (!isStyleCSSRequest(resourcePath) || !isMasterStyleSource(source, state.options.module)) return source
    const options = resolveOptions({
        mode: 'extract',
        config: state.options.config,
        extractorOptions: state.options.extractorOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateExtractSession(state.projectDir, state.outputPath, options)
    await registerStyleCSSSource(session.extractor, session.styleCSSSources, resourcePath, source, {
        moduleIds: state.options.module,
        projectDir: state.projectDir
    })
    await session.write()
    return readFile(state.outputPath, 'utf-8')
}

async function createExtractedCSS(projectDir: string, session: ExtractSession) {
    return createExtractorExtractedCSS({
        extractor: session.extractor,
        styleCSSSources: session.styleCSSSources,
        projectDir
    })
}

async function writeExtractedCSS(outputPath: string, cssText: string) {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, cssText)
}

function createSession(projectDir: string, outputPath: string, options: ResolvedOptions): ExtractSession {
    const extractor = new CSSExtractor(resolveExtractorOptions(options), projectDir)
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
        ready,
        write,
        styleCSSSources: new Map()
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
            module: options.module,
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
