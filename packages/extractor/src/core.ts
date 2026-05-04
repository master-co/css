import { default as defaultOptions, Options } from './options'
import { createCSS, MasterCSS } from '@master/css'
import type { Config } from '@master/css'
import extractLatentClasses from './functions/extract-latent-classes'
import fs, { existsSync } from 'fs'
import { minimatch } from 'minimatch'
import log from '@techor/log'
import extend from '@techor/extend'
import exploreConfig from 'explore-config'
import exploreCSSConfig from '@master/css-explore-config'
import { generateValidRules } from '@master/css-validator'
import chokidar, { type ChokidarOptions, type FSWatcher } from 'chokidar'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import cssEscape from 'shared/utils/css-escape'
import { explorePathsSync } from '@techor/glob'
import path, { resolve } from 'path'
import { Stats } from 'node:fs'
import bytes from 'bytes'

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default class CSSExtractor extends EventEmitter {
    latentClasses = new Set<string>()
    validClasses = new Set<string>()
    invalidClasses = new Set<string>()
    watching = false
    watchers: FSWatcher[] = []
    initialized = false
    initializing?: Promise<this>

    /**
     * Per-source content-hash cache. When the same `source` arrives with the
     * same `content` (HMR re-fires the same file unchanged, vite transform
     * runs the same module twice), we skip re-running the regex pipeline
     * and re-validating every class.
     */
    private contentHashes = new Map<string, string>()

    /**
     * Memoized result of `generateValidRules` per syntax string. The same
     * class commonly appears in 100+ files in real codebases; without this,
     * we re-run css.generate() + validateCSS() per occurrence. With it, the
     * second occurrence is an O(1) Map lookup.
     */
    private validRulesCache = new Map<string, ReturnType<typeof generateValidRules>>()

    /** Memoized result of `fixedSourcePaths` getter (fs IO via fast-glob). */
    private cachedFixedSourcePaths?: string[]
    /** Memoized result of `allowedSourcePaths` getter (fs IO via fast-glob). */
    private cachedAllowedSourcePaths?: string[]

    constructor(
        public customOptions: Options | string = 'master.css-extractor',
        public cwd = process.cwd()
    ) {
        super()
    }

    init(customOptions = this.customOptions) {
        if (this.initialized) return Promise.resolve(this)
        if (this.initializing) return this.initializing
        return this.initializing = this.initInternal(customOptions)
            .finally(() => {
                this.initializing = undefined
            })
    }

    private async initInternal(customOptions = this.customOptions) {
        if (typeof customOptions === 'string') {
            this.options = extend(defaultOptions, exploreConfig(customOptions, {
                found: (basename) => {
                    if (process.env.DEBUG) {
                        log.i`**${basename}** found`
                    }
                },
                cwd: this.cwd
            }), customOptions)
        } else {
            this.options = extend(defaultOptions, customOptions)
        }
        if (this.options.verbose && this.options.verbose > 1) {
            log.ok`**options**`
            log.tree(this.options)
            log``
        }
        this.css = createCSS(
            typeof this.options.config === 'object'
                ? this.options.config
                : (await exploreCSSConfig({
                    name: this.options.config as string,
                    cwd: this.cwd
                }))?.config
        )
        this.emit('init', this.options, this.config)
        this.initialized = true
        return this
    }

    async reset(customOptions = this.customOptions) {
        const watching = this.watching
        if (watching) await this.closeWatch({ emit: false })
        this.latentClasses.clear()
        this.validClasses.clear()
        this.invalidClasses.clear()
        this.contentHashes.clear()
        this.validRulesCache.clear()
        this.cachedFixedSourcePaths = undefined
        this.cachedAllowedSourcePaths = undefined
        this.initialized = false
        this.initializing = undefined
        await this.init(customOptions)
        await this.prepare()
        if (watching) await this.startWatch({ emit: false })
        this.emit('reset')
        return this
    }

    async destroy() {
        this.latentClasses.clear()
        this.validClasses.clear()
        this.invalidClasses.clear()
        this.contentHashes.clear()
        this.validRulesCache.clear()
        this.removeAllListeners()
        await this.closeWatch()
        this.emit('destroy')
        return this
    }

    async prepare() {
        /* 插入指定的固定 class */
        if (this.options.includeClasses?.length) {
            for (const eachFixedClass of this.options.includeClasses) {
                this.css.add(eachFixedClass)
            }
            if (this.options.verbose) {
                log.ok`${this.options.includeClasses.length} fixed classes inserted ${this.options.includeClasses}`
            }
        }
        await Promise.all([
            this.insertFiles(this.fixedSourcePaths),
            this.insertFiles(this.allowedSourcePaths)
        ])
    }

    /**
     * @description Filter based on relative file paths and extract content
     * @param source
     * @param content
     * @returns string[] Latent classes
     */
    extract(source: string, content: string): string[] {
        if (!source || !content || !this.isSourceAllowed(source)) {
            return []
        }
        const latentClasses: string[] = []
        for (const eachLatentClasses of extractLatentClasses(content)) {
            if (this.latentClasses.has(eachLatentClasses)) {
                continue
            } else {
                this.latentClasses.add(eachLatentClasses)
                latentClasses.push(eachLatentClasses)
            }
        }
        return latentClasses
    }

    /**
     * @description Filter based on relative file paths, extract content, and insert
     * @param source
     * @param content
     * @returns string[] Latent classes
     */
    async insert(source: string, content: string): Promise<boolean> {
        if (!content) {
            return false
        }

        // Skip the whole pipeline when this exact (source, content) pair has
        // already been processed. HMR commonly re-fires unchanged files; vite
        // can also call `transform` on the same module twice. Hashing 1 KB of
        // source via SHA-1 is ~2 µs; running extract + validate on it is ms.
        if (source) {
            const hash = createHash('sha1').update(content).digest('hex')
            if (this.contentHashes.get(source) === hash) {
                return false
            }
            this.contentHashes.set(source, hash)
        }

        const allLatent = this.extract(source, content)
        if (!allLatent.length) {
            return false
        }

        // Single-pass filter (was three sequential `.filter` chains, each
        // allocating a new array). Skip classes already known invalid /
        // already known valid / explicitly excluded by user config.
        const excludeClasses = this.options.excludeClasses
        const latentClasses: string[] = []
        for (const eachLatentClass of allLatent) {
            if (this.invalidClasses.has(eachLatentClass)) continue
            if (this.validClasses.has(eachLatentClass)) continue
            if (excludeClasses?.length) {
                let excluded = false
                for (const eachIgnoreClass of excludeClasses) {
                    if (typeof eachIgnoreClass === 'string') {
                        if (eachIgnoreClass === eachLatentClass) { excluded = true; break }
                    } else if (eachIgnoreClass.test(eachLatentClass)) {
                        excluded = true
                        break
                    }
                }
                if (excluded) continue
            }
            latentClasses.push(eachLatentClass)
        }
        if (!latentClasses.length) {
            return false
        }

        let time = process.hrtime()
        // Synchronous loop — generateValidRules is sync; the previous
        // `Promise.all(map(async))` was just microtask overhead with no
        // parallelism in single-threaded JS. Per-class result is also memoized
        // so repeated occurrences across files are O(1).
        const validClasses: string[] = []
        for (const eachLatentClass of latentClasses) {
            let validRules = this.validRulesCache.get(eachLatentClass)
            if (validRules === undefined) {
                validRules = generateValidRules(eachLatentClass, this.css)
                this.validRulesCache.set(eachLatentClass, validRules)
            }
            if (validRules.length) {
                for (const validRule of validRules) {
                    validRule.layer.insert(validRule)
                }
                validClasses.push(eachLatentClass)
                this.validClasses.add(eachLatentClass)
            } else {
                this.invalidClasses.add(eachLatentClass)
            }
        }
        if (this.css.definedRules.length && validClasses.length) {
            if (this.options.verbose) {
                time = process.hrtime(time)
                const spent = Math.round(((time[0] * 1e9 + time[1]) / 1e6) * 10) / 10
                log.ok`**${path.relative(this.cwd, source)}** ${validClasses.length} classes inserted ${log.chalk.gray('in')} ${spent}ms ${this.options.verbose > 1 ? validClasses : ''}`
            }
            this.emit('change')
        }
        return true
    }

    insertFile(source: string) {
        return this.insert(source, fs.readFileSync(path.resolve(this.cwd, source), { encoding: 'utf-8' }).toString())
    }

    insertFiles(sources: string[]) {
        return Promise.all(sources.map((eachRelPaths) => this.insertFile(eachRelPaths)))
    }

    export(filename = this.options.output as string) {
        const filepath = path.resolve(this.cwd, filename)
        const dir = path.dirname(filepath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(filepath, this.css.text)
        if (this.options.verbose) {
            log.ok`**${filename}** exported ${bytes(this.css.text.length)}`
        }
        this.emit('export', filename, filepath)
    }

    async watchSource(paths: string | string[], watchOptions?: ChokidarOptions): Promise<void> {
        await this.watch('add change', paths, (source) => this.insertFile(source), watchOptions)
    }

    async watch(events: string, paths: string | string[], handle: (path: string, stats?: Stats | undefined) => void, watchOptions?: ChokidarOptions): Promise<void> {
        watchOptions = extend({ ignoreInitial: true, cwd: this.cwd }, watchOptions)
        const watcher = chokidar.watch(paths, watchOptions)
        this.watchers.push(watcher)
        events
            .split(' ')
            .forEach((eachEvent) => watcher.on(eachEvent, handle as never))
        await new Promise<void>(resolve => {
            watcher.once('ready', resolve)
        })
        // Let chokidar finish registering native watchers before callers mutate files.
        await new Promise(resolve => setTimeout(resolve, 0))
    }

    async startWatch(options: { emit?: boolean } = { emit: true }) {
        if (this.watching) return
        const resolvedConfigPath = this.resolvedConfigPath
        const resolvedOptionsPath = this.resolvedOptionsPath

        const sourcePaths = this.options.sources?.length
            ? this.fixedSourcePaths
            : this.allowedSourcePaths
        if (sourcePaths.length) {
            await this.watchSource(sourcePaths)
        }

        if (resolvedConfigPath) {
            await this.watch('add change unlink', resolvedConfigPath, async () => {
                if (this.options.verbose) {
                    log``
                    log`[change] **${this.configPath}**`
                }
                await this.reset()
                this.emit('configChange')
            })
        }

        if (resolvedOptionsPath) {
            await this.watch('add change unlink', resolvedOptionsPath, async () => {
                if (this.options.verbose) {
                    log``
                    log`[change] **${this.customOptions}**`
                }
                await this.reset()
                this.emit('optionsChange')
            })
        }
        this.watching = true
        if (options?.emit) this.emit('watchStart')
    }

    async closeWatch(options: { emit?: boolean } = { emit: true }) {
        if (!this.watching) return
        if (this.watchers.length) {
            await Promise.all(this.watchers.map(eachWatcher => eachWatcher.close()))
            this.watchers = []
        }
        this.watching = false
        if (options?.emit) this.emit('watchClose')
    }

    /**
     * computed from `options.sources`. Memoized — each access used to re-glob
     * the filesystem which is expensive on large projects. Cleared on `reset()`.
     */
    get fixedSourcePaths(): string[] {
        if (this.cachedFixedSourcePaths) return this.cachedFixedSourcePaths
        const { sources } = this.options
        const computed = sources?.length
            ? explorePathsSync(sources, { cwd: this.cwd })
                .filter((eachSourcePath) => !!eachSourcePath)
            : []
        this.cachedFixedSourcePaths = computed
        return computed
    }

    /**
     * resolved from `fixedSourcePaths`
     */
    get resolvedFixedSourcePaths(): string[] {
        return this.fixedSourcePaths.map((eachSourcePath) => path.resolve(this.cwd, eachSourcePath))
    }

    /**
     * `options.include` - `options.exclude`. Memoized — same reason as
     * `fixedSourcePaths`. Cleared on `reset()`.
     */
    get allowedSourcePaths(): string[] {
        if (this.cachedAllowedSourcePaths) return this.cachedAllowedSourcePaths
        const { include, exclude } = this.options
        const computed = include?.length
            ? explorePathsSync(include, { cwd: this.cwd, ignore: exclude })
                .filter((eachSourcePath) => Boolean(eachSourcePath))
            : []
        this.cachedAllowedSourcePaths = computed
        return computed
    }

    /**
     * resolved from `allowedSourcePaths`
     */
    get resolvedAllowedSourcePaths(): string[] {
        return this.allowedSourcePaths.map((eachSourcePath) => path.resolve(this.cwd, eachSourcePath))
    }

    isSourceAllowed(source: string): boolean {
        /* remove if params exists */
        if (source.includes('?')) {
            source = source.split('?')[0]
        }
        const { include, exclude, sources } = this.options
        if (sources)
            for (const eachSource of sources) {
                if (minimatch(source, eachSource, { dot: true })) return true
            }
        if (include)
            for (const eachIncludePattern of include) {
                if (!minimatch(source, eachIncludePattern, { dot: true })) return false
            }
        if (exclude)
            for (const eachExcludePattern of exclude) {
                if (minimatch(source, eachExcludePattern, { dot: true })) return false
            }
        return true
    }

    /**
     * computed from `options.config`
     */
    get config(): Config {
        return this.css.config
    }

    /**
     * computed from string `options.config`
    */
    get configPath(): string | undefined {
        if (typeof this.options.config === 'string') {
            // try to find the config file with the given name and options.extensions
            for (const eachExtension of ['js', 'mjs', 'ts', 'cjs', 'cts', 'mts']) {
                const eachBasename = this.options.config + '.' + eachExtension
                if (existsSync(resolve(this.cwd || '', eachBasename))) {
                    return eachBasename
                }
            }
        }
    }

    /**
     * computed from string `options.config`
    */
    get resolvedConfigPath(): string | undefined {
        const configPath = this.configPath
        if (configPath) {
            return path.resolve(this.cwd, configPath)
        }
    }

    /**
     * computed from string `customOptions`
    */
    get optionsPath(): string | undefined {
        if (typeof this.customOptions === 'string') {
            // try to find the config file with the given name and options.extensions
            for (const eachExtension of ['js', 'mjs', 'ts', 'cjs', 'cts', 'mts']) {
                const eachBasename = this.customOptions + '.' + eachExtension
                if (existsSync(resolve(this.cwd || '', eachBasename))) {
                    return eachBasename
                }
            }
        }
    }

    /**
     * computed from string `customOptions`
    */
    get resolvedOptionsPath(): string | undefined {
        const optionsPath = this.optionsPath
        if (optionsPath) {
            return path.resolve(this.cwd, optionsPath)
        }
    }

    get resolvedVirtualModuleId(): string {
        return '\0' + this.options.module
    }

    get slotCSSRule(): string {
        return '#' + cssEscape(this.options.module as string) + '{--slot:0}'
    }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default interface CSSExtractor {
    css: MasterCSS
    options: Options
}
