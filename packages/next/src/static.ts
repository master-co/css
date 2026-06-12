import CSSExtractor, { type Options as ExtractorOptions } from '@master/css-extractor'
import defaultExtractorOptions from '@master/css-extractor/options'
import {
    createStyleCSSHostSource,
    createExtractedCSS as createExtractorStaticCSS,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-extractor/style'
import { findCSSPlanEntryFiles } from '@master/css-configer/css'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { resolveOptions, type Options, type ResolvedOptions } from './options'

const STATE_VERSION = 1
const DEFAULT_STATIC_OUTPUT = '.master/next.css'
const DEFAULT_STATE_FILE = 'next-static-state.json'
const DEFAULT_SCAN_LOG_FILE = 'next-static-scanned-sources.log'

export interface StaticState {
    version: 1
    projectDir: string
    outputPath: string
    scanLogPath: string
    options: {
        extractorOptions: ExtractorOptions
        debug: boolean
    }
}

interface StaticSession {
    extractor: CSSExtractor
    styleCSSSources: StyleCSSSources
    ready: Promise<CSSExtractor>
    write: () => Promise<void>
    watching?: boolean
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

function resolveExtractorOptions(options: ResolvedOptions): ExtractorOptions {
    const exclude = [
        ...(defaultExtractorOptions.exclude || []),
        '**/node_modules/**',
        ...(options.extractorOptions.exclude || [])
    ]
    return {
        ...options.extractorOptions,
        exclude: [...new Set(exclude)],
        output: DEFAULT_STATIC_OUTPUT,
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

export async function transformStaticStyleSource(statePath: string, resourcePath: string, source: string) {
    const state = readStaticState(statePath)
    if (!isStyleCSSRequest(resourcePath)) return source
    if (!resolveMasterStyleSource(resourcePath, source, state.projectDir)) return source
    if (isMasterCSSPackageStyleFile(resourcePath, state.projectDir)) {
        return removeMasterStyleDirectives(source).code
    }
    const options = resolveOptions({
        mode: 'static',
        extractorOptions: state.options.extractorOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
    await registerStyleCSSSource(session.extractor, session.styleCSSSources, resourcePath, source, {
        projectDir: state.projectDir
    })
    await session.write()
    return createStyleCSSHostSource(source, { masterImport: toCSSImportPath(resourcePath, state.outputPath) })
}

async function createStaticCSS(projectDir: string, session: StaticSession) {
    return createExtractorStaticCSS({
        extractor: session.extractor,
        styleCSSSources: session.styleCSSSources,
        projectDir
    })
}

async function registerStyleCSSEntries(projectDir: string, session: StaticSession) {
    for (const entry of await findCSSPlanEntryFiles(projectDir)) {
        await registerStyleCSSSource(session.extractor, session.styleCSSSources, entry, await readFile(entry, 'utf8'), {
            projectDir
        })
    }
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
    const extractor = new CSSExtractor(resolveExtractorOptions(options), projectDir)
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
            extractorOptions: resolveExtractorOptions(options),
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
        extractorOptions: state.options.extractorOptions,
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

export async function scanStaticModule(statePath: string, resourcePath: string, source: string) {
    const state = readStaticState(statePath)
    const options = resolveOptions({
        mode: 'static',
        extractorOptions: state.options.extractorOptions,
        debug: state.options.debug
    })
    const session = await getOrCreateStaticSession(state.projectDir, state.outputPath, options)
    await appendScannedSource(state.scanLogPath, resourcePath)
    const changed = await session.extractor.insert(resourcePath, source)
    if (changed) {
        await session.write()
    } else if (!existsSync(state.outputPath)) {
        const cssText = await createStaticCSS(state.projectDir, session)
        await writeStaticCSS(state.outputPath, cssText)
    }
}
