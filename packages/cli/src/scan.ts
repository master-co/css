import type { ScannerOptions } from '@master/css-scanner'
import type CSSScanner from '@master/css-scanner'
import {
    createExtractedCSS,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import log from '@techor/log'
import { explorePathsSync } from '@techor/glob'
import bytes from 'bytes'
import chokidar, { type FSWatcher } from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'

export const DEFAULT_SCAN_OUTPUT = 'master.css'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,mjs,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']

export interface ScanOptions {
    watch?: boolean
    output?: string
    verbose?: string | number
    export?: boolean
    cwd?: string
}

async function registerManagedCSSEntries(scanner: CSSScanner, styleCSSSources: StyleCSSSources) {
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

function resolveSourcePaths(scanner: CSSScanner, sourcePatterns: string[], ignore: string[] = []) {
    return explorePathsSync(sourcePatterns, { cwd: scanner.cwd, ignore })
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

function exportCSS(scanner: CSSScanner, css: string, filename = DEFAULT_SCAN_OUTPUT) {
    const filepath = path.resolve(scanner.cwd, filename)
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filepath, css)
    if (scanner.options.verbose) {
        log.ok`**${filename}** exported ${bytes(css.length)}`
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
    const CSSScanner = (await import('@master/css-scanner')).default
    const { watch, output, verbose, cwd } = options
    const scanner = new CSSScanner({}, cwd)
    const styleCSSSources: StyleCSSSources = new Map()
    const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
    const writeOutput = async () => {
        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: scanner.cwd
        })
        if (options.export) {
            exportCSS(scanner, css, output)
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
        sourcePatterns,
        specifiedSourcePaths.length ? [] : scanner.options.exclude
    )
    if (watch) {
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
                            log``
                            log`[change] **${formatWatchedPath(scanner.cwd, resetDependency)}**`
                        }
                        await closeWatchers()
                        await scanner.reset(scanner.customOptions, { emit: false })
                        await prepareScanner(scanner, styleCSSSources, scanPaths())
                        await queueWrite()
                        await startWatchers()
                        log``
                        log.t`Restart watching source changes`
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
        await prepareScanner(scanner, styleCSSSources, scanPaths())
        await queueWrite()
        await startWatchers()
        log``
        log.t`Start watching source changes`
    } else {
        await prepareScanner(scanner, styleCSSSources, scanPaths())
        await writeOutput()
    }
}
