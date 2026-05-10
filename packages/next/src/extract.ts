import CSSExtractor, { type Options as ExtractorOptions } from '@master/css-extractor'
import defaultExtractorOptions from '@master/css-extractor/options'
import { compileCSS, type CompileCSSOptions } from '@master/css-compiler'
import { createCSS, extendConfig, VariableRule, type Config } from '@master/css'
import { loadConfig, resolveConfigPath } from '@master/css-explore-config'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveOptions, type Options, type ResolvedOptions } from './options'

const STATE_VERSION = 1
const DEFAULT_EXTRACT_OUTPUT = '.master-css/next.css'
const DEFAULT_STATE_FILE = 'next-extract-state.json'
const DEFAULT_SCAN_LOG_FILE = 'next-extract-scanned-sources.log'
const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const require = createRequire(import.meta.url)

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

type CSSInstance = ReturnType<typeof createCSS>
type VariableDefinition = NonNullable<Config['variables']>[number]

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

function getExtractorClasses(extractor: CSSExtractor) {
    return [...new Set([
        ...(extractor.latentClasses || []),
        ...(extractor.validClasses || []),
        ...(extractor.usedNativeClasses || []),
        ...(extractor.options.includeClasses || [])
    ])]
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createVirtualCSSImportPattern(moduleId: string) {
    const escapedModuleId = escapeRegExp(moduleId)
    return new RegExp(String.raw`@import\s+(?:url\(\s*)?(['"])${escapedModuleId}\1\s*\)?[^;]*;`)
}

export function createMasterStyleCSSPattern(moduleId: string) {
    return new RegExp(`@master|${createVirtualCSSImportPattern(moduleId).source}`)
}

function cleanStyleRequest(id: string) {
    return id.replace(/[?#].*$/, '')
}

export function isStyleCSSRequest(id: string) {
    return STYLE_CSS_REQUEST_RE.test(id)
}

function replaceVirtualCSSImport(source: string, moduleId: string, replacement: string) {
    let replaced = false
    const code = source.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (id !== moduleId) return rule
        replaced = true
        return replacement
    })
    return { code, replaced }
}

function removeVirtualCSSImport(source: string, moduleId: string) {
    return replaceVirtualCSSImport(source, moduleId, '').code
}

function hasVirtualCSSImport(source: string, moduleId: string) {
    return replaceVirtualCSSImport(source, moduleId, '').replaced
}

export function isMasterStyleSource(source: string, moduleId: string) {
    return source.includes('@master') || hasVirtualCSSImport(source, moduleId)
}

async function preprocessStyleCSS(source: string, id: string) {
    const filename = cleanStyleRequest(id)
    const extension = extname(filename)
    if (extension !== '.scss' && extension !== '.sass') return source

    const sass = require('sass') as typeof import('sass')
    const result = await sass.compileStringAsync(source, {
        url: pathToFileURL(filename),
        style: 'expanded',
        syntax: extension === '.sass' ? 'indented' : 'scss'
    })
    return result.css
}

async function compileStyleCSS(id: string, source: string, options: CompileCSSOptions = {}) {
    const css = await preprocessStyleCSS(source, id)
    return compileCSS(css, {
        ...options,
        from: cleanStyleRequest(id)
    })
}

function getNativeCSS(result: { css?: string, generatedCSS?: string, nativeCSS?: string }) {
    if (result.nativeCSS !== undefined) return result.nativeCSS
    const css = result.css || ''
    const generatedCSS = result.generatedCSS || ''
    if (generatedCSS && css.endsWith(generatedCSS)) {
        return css.slice(0, -generatedCSS.length).trim()
    }
    return css
}

function getVariableDefinitionName(definition: VariableDefinition) {
    return definition.namespace
        ? `${definition.namespace.replace(/\./g, '-')}${definition.key ? '-' + definition.key : ''}`
        : definition.key
}

function collectCSSVariableReferences(source: string) {
    const references = new Set<string>()
    for (const match of source.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
        references.add(match[1])
    }
    return references
}

function collectConfigVariableNames(configs: Config[]) {
    const names = new Set<string>()
    for (const config of configs) {
        for (const definition of config.variables || []) {
            names.add(getVariableDefinitionName(definition))
        }
    }
    return names
}

function insertVariableRules(css: CSSInstance, variableNames: Iterable<string>) {
    for (const variableName of variableNames) {
        const variable = css.variables.get(variableName)
        if (!variable) continue
        css.themeLayer.insert(new VariableRule(variableName, variable, css))
    }
}

function insertStyleVariableRules(css: CSSInstance, styleConfigs: Config[], nativeCSS: string[]) {
    const styleVariableNames = collectConfigVariableNames(styleConfigs)
    const variableNames = new Set(styleVariableNames)
    for (const source of nativeCSS) {
        for (const variableName of collectCSSVariableReferences(source)) {
            if (css.variables.has(variableName)) {
                variableNames.add(variableName)
            }
        }
    }
    insertVariableRules(css, variableNames)
}

function refreshExtractorNativeClasses(extractor: CSSExtractor, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!extractor.nativeClassNames.has(className)) {
            extractor.nativeClassNames.add(className)
            changed = true
        }
        if (extractor.latentClasses.has(className) && !extractor.usedNativeClasses.has(className)) {
            extractor.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        extractor.emit('change')
    }
}

async function registerStyleCSSSource(session: ExtractSession, id: string, source: string) {
    const filename = cleanStyleRequest(id)
    const cleanSource = removeVirtualCSSImport(source, session.extractor.options.module as string)
    const result = await compileStyleCSS(filename, cleanSource)
    session.styleCSSSources.set(filename, cleanSource)
    refreshExtractorNativeClasses(session.extractor, result.nativeClassNames)
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
    await registerStyleCSSSource(session, resourcePath, source)
    await session.write()
    return readFile(state.outputPath, 'utf-8')
}

async function createExtractedCSS(projectDir: string, session: ExtractSession) {
    const extractor = session.extractor
    const classes = getExtractorClasses(session.extractor)
    const config = extractor.options.config
    const resolvedConfig = typeof config === 'string'
        ? resolveConfigPath({ cwd: projectDir, name: config })
        : undefined
    const styleResults = await Promise.all(
        Array.from(session.styleCSSSources)
            .map(([id, source]) => compileStyleCSS(id, source, { classes }))
    )
    const styleConfigs = styleResults.map((result) => result.config)
    const configResult = resolvedConfig
        ? await loadConfig(resolvedConfig.path, { classes })
        : undefined
    const nativeCSS = styleResults.map(getNativeCSS).filter(Boolean)
    if (configResult) {
        const configNativeCSS = getNativeCSS(configResult)
        if (configNativeCSS) nativeCSS.push(configNativeCSS)
    }
    const css = createCSS(extendConfig(
        ...styleConfigs,
        typeof config === 'string'
            ? configResult?.config
            : config
    ))
    insertStyleVariableRules(css, styleConfigs, nativeCSS)
    for (const className of classes) {
        css.add(className)
    }
    return [
        ...nativeCSS,
        css.text
    ].filter(Boolean).join('\n\n')
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
