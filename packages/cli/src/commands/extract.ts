import type { Command } from 'commander'
import { options, type Options } from '@master/css-extractor'
import type CSSExtractor from '@master/css-extractor'
import {
    createExtractedCSS,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-extractor/style'
import { findCSSConfigEntryFiles } from '@master/css-configer/css'
import log from '@techor/log'
import bytes from 'bytes'
import chokidar, { type FSWatcher } from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'

async function registerManagedCSSEntries(extractor: CSSExtractor, styleCSSSources: StyleCSSSources) {
    styleCSSSources.clear()
    for (const entry of await findCSSConfigEntryFiles(extractor.cwd)) {
        await registerStyleCSSSource(extractor, styleCSSSources, entry, fs.readFileSync(entry, 'utf8'), {
            projectDir: extractor.cwd
        })
    }
    extractor.configDependencies = [...new Set(
        Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
    )]
}

async function prepareExtractor(extractor: CSSExtractor, styleCSSSources: StyleCSSSources) {
    await registerManagedCSSEntries(extractor, styleCSSSources)
    await extractor.prepare()
}

function exportCSS(extractor: CSSExtractor, css: string, filename = extractor.options.output as string) {
    const filepath = path.resolve(extractor.cwd, filename)
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filepath, css)
    if (extractor.options.verbose) {
        log.ok`**${filename}** exported ${bytes(css.length)}`
    }
    extractor.emit('export', filename, filepath)
}

function formatWatchedPath(cwd: string, file: string) {
    return path.isAbsolute(file) ? path.relative(cwd, file) : file
}

export default (program: Command) => program
    .command('extract')
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path', options.output)
    .option('-v, --verbose <level>', 'Verbose logging 0~N', '1')
    .option('--no-export', 'Print only CSS results.')
    .action(async function (specifiedSourcePaths: any, options?: {
        watch?: boolean,
        output?: string,
        verbose?: number,
        export?: boolean,
        cwd?: string
    }) {
        const CSSExtractor = (await import('@master/css-extractor')).default
        const { watch, output, verbose, cwd } = options || {}
        const extractor = new CSSExtractor({}, cwd)
        const styleCSSSources: StyleCSSSources = new Map()
        const writeOutput = async () => {
            const css = await createExtractedCSS({
                extractor,
                styleCSSSources,
                projectDir: extractor.cwd
            })
            if (options?.export) {
                exportCSS(extractor, css)
            } else {
                console.log(css)
            }
        }
        extractor.on('init', (options: Options) => {
            if (specifiedSourcePaths?.length) {
                options.include = specifiedSourcePaths
                options.exclude = []
            } else {
                if (!options.exclude?.includes('**/node_modules/**')) {
                    options.exclude?.push('**/node_modules/**')
                }
                if (!options.exclude?.includes('node_modules')) {
                    options.exclude?.push('node_modules')
                }
            }
            options.output = output
            options.verbose = verbose ? +verbose : options.verbose
        })
        await extractor.init()
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
                const sourcePaths = extractor.options.required?.length
                    ? extractor.fixedSourcePaths
                    : extractor.allowedSourcePaths
                if (sourcePaths.length) {
                    const sourceWatcher = chokidar.watch(sourcePaths, {
                        cwd: extractor.cwd,
                        ignoreInitial: true
                    })
                    sourceWatcher.on('add', (source) => {
                        void extractor.insertFile(source).then(queueWrite)
                    })
                    sourceWatcher.on('change', (source) => {
                        void extractor.insertFile(source).then(queueWrite)
                    })
                    watchers.push(sourceWatcher)
                    await new Promise<void>((resolve) => sourceWatcher.once('ready', resolve))
                }
                if (extractor.configDependencies.length) {
                    const configWatcher = chokidar.watch(extractor.configDependencies, {
                        ignoreInitial: true
                    })
                    const handleConfigChange = async (configDependency: string) => {
                        if (restarting) return
                        restarting = true
                        try {
                            if (extractor.options.verbose) {
                                log``
                                log`[change] **${formatWatchedPath(extractor.cwd, configDependency)}**`
                            }
                            await closeWatchers()
                            await extractor.reset()
                            await prepareExtractor(extractor, styleCSSSources)
                            await queueWrite()
                            log``
                            log.t`Restart watching source changes`
                            await startWatchers()
                            extractor.emit('configChange')
                        } finally {
                            restarting = false
                        }
                    }
                    configWatcher.on('add', (configDependency) => {
                        void handleConfigChange(configDependency)
                    })
                    configWatcher.on('change', (configDependency) => {
                        void handleConfigChange(configDependency)
                    })
                    configWatcher.on('unlink', (configDependency) => {
                        void handleConfigChange(configDependency)
                    })
                    watchers.push(configWatcher)
                    await new Promise<void>((resolve) => configWatcher.once('ready', resolve))
                }
            }
            process.once('SIGTERM', () => {
                void closeWatchers().finally(() => process.exit(0))
            })
            process.once('SIGINT', () => {
                void closeWatchers().finally(() => process.exit(0))
            })
            await prepareExtractor(extractor, styleCSSSources)
            await queueWrite()
            await startWatchers()
            log``
            log.t`Start watching source changes`
        } else {
            await prepareExtractor(extractor, styleCSSSources)
            await writeOutput()
        }
    })
