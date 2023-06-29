import upath from 'upath'
import { default as defaultOptions, Options } from './options'
import MasterCSS from '@master/css'
import type { Config } from '@master/css'
import extractLatentClasses from './functions/extract-latent-classes'
import fs from 'fs'
import fg, { Pattern } from 'fast-glob'
import { minimatch } from 'minimatch'
import log, { chalk } from '@techor/log'
import { extend } from '@techor/extend'
import exploreConfig, { exploreConfigPath, exploreResolvedConfigPath } from 'explore-config'
import { createValidRules } from '@master/css-validator'
import chokidar from 'chokidar'
import { EventEmitter } from 'node:events'

export default class CSSExtractor {

    css: MasterCSS
    latentClasses = new Set<string>()
    validClasses = new Set<string>()
    invalidClasses = new Set<string>()
    options: Options
    watching = false
    watchers: chokidar.FSWatcher[] = []
    emitter = new EventEmitter()

    on = this.emitter.on
    off = this.emitter.off
    once = this.emitter.once
    emit = this.emitter.emit
    removeAllListeners = this.emitter.removeAllListeners

    get hotModuleId() {
        return '\0' + this.options.module
    }

    get hotModuleEvent() {
        return `HMR:${this.options.module}`
    }

    constructor(
        public customOptions: Options | Pattern | Pattern[] = 'master.css-extractor.*'
    ) { }

    init(customOptions = this.customOptions) {
        if (typeof customOptions === 'string' || Array.isArray(customOptions)) {
            this.options = extend(defaultOptions, exploreConfig(customOptions, {
                on: {
                    found: (foundPath: string) => log.ok`**${foundPath}** file found`,
                    notFound: () => log.i`No **${customOptions}** file found`
                }
            }), customOptions)
        } else {
            this.options = extend(defaultOptions, customOptions)
        }
        if (this.options.verbose > 1) {
            log.ok`**options**`
            log.tree(this.options)
            log``
        }
        this.css = new MasterCSS(
            typeof this.options.config === 'object'
                ? this.options.config
                : (exploreConfig(this.options.config, { cwd: this.cwd }) || {})
        )
        this.emit('init', this.options, this.config)
    }

    async reset(customOptions = this.customOptions) {
        if (this.watching) await this.disableWatch()
        this.latentClasses.clear()
        this.validClasses.clear()
        this.invalidClasses.clear()
        this.init(customOptions)
        await this.prepare()
        if (this.watching) await this.initWatch()
        this.emit('reset')
        return this
    }

    async destroy() {
        this.latentClasses.clear()
        this.validClasses.clear()
        this.invalidClasses.clear()
        this.removeAllListeners()
        this.emit('destroy')
        return this
    }

    async prepare() {
        /* 插入指定的固定 class */
        if (this.options.classes?.fixed?.length) {
            for (const eachFixedClass of this.options.classes.fixed) {
                this.css.insert(eachFixedClass)
            }
            if (this.options.verbose) {
                log.ok`${this.options.classes.fixed.length} fixed classes inserted ${this.options.classes.fixed}`
            }
        }
        await this.insertFiles(this.fixedSourcePaths)
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
        let latentClasses = this.extract(source, content)
        if (!latentClasses.length) {
            return false
        }

        /**
         * 排除已驗證為 invalid 的 extraction
         */
        if (this.invalidClasses.size) {
            latentClasses = latentClasses.filter((eachLatentClass) => !this.invalidClasses.has(eachLatentClass))
        }

        /**
         * 排除已驗證為 valid 的 extraction
         */
        if (this.validClasses.size) {
            latentClasses = latentClasses.filter((eachLatentClass) => !this.validClasses.has(eachLatentClass))
        }

        /* 排除指定的 class */
        if (this.options.classes?.ignored?.length)
            latentClasses = latentClasses.filter((eachLatentClass) => {
                for (const eachIgnoreClass of this.options.classes.ignored) {
                    if (typeof eachIgnoreClass === 'string') {
                        if (eachIgnoreClass === eachLatentClass) return false
                    } else if (eachIgnoreClass.test(eachLatentClass)) {
                        return false
                    }
                }
                return true
            })

        let time = process.hrtime()
        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        const validClasses = []

        await Promise.all(
            latentClasses
                .map(async (eachLatentClass) => {
                    const validRules = createValidRules(eachLatentClass, { css: this.css })
                    if (validRules.length) {
                        this.css.insertRules(validRules)
                        validClasses.push(eachLatentClass)
                        this.validClasses.add(eachLatentClass)
                    } else {
                        this.invalidClasses.add(eachLatentClass)
                    }
                })
        )
        time = process.hrtime(time)
        const spent = Math.round(((time[0] * 1e9 + time[1]) / 1e6) * 10) / 10
        if (this.css.rules.length && validClasses.length) {
            if (this.options.verbose) {
                log.ok`**${upath.relative(this.cwd, source)}** ${validClasses.length} classes inserted ${chalk.gray('in')} ${spent}ms ${this.options.verbose > 1 ? validClasses : ''}`
            }
            this.emit('change')
        }
        return true
    }

    insertFile(source: string) {
        return this.insert(source, fs.readFileSync(upath.resolve(this.cwd, source), { encoding: 'utf-8' }).toString())
    }

    insertFiles(sources: string[]) {
        return Promise.all(sources.map((eachRelPaths) => this.insertFile(eachRelPaths)))
    }

    export(filename = this.options.module) {
        const filepath = upath.resolve(this.cwd, filename)
        fs.writeFileSync(filepath, this.css.text)
        if (this.options.verbose) {
            log.success`${this.css.rules.length} rules exported ${chalk.gray('in')} **${filename}**`
        }
    }

    watchSource(paths: string | readonly string[], watchOptions?: chokidar.WatchOptions) {
        this.watch('add change', paths, (source) => this.insertFile(source), watchOptions)
    }

    watch(events: string, paths: string | readonly string[], handle: (path: string, stats?: fs.Stats) => void, watchOptions?: chokidar.WatchOptions) {
        watchOptions = extend({ ignoreInitial: true, cwd: this.cwd }, watchOptions)
        const watcher = chokidar.watch(paths, watchOptions)
        this.watchers.push(watcher)
        events
            .split(' ')
            .forEach((eachEvent) => watcher.on(eachEvent, handle))
    }

    private initWatch() {
        const resolvedConfigPath = this.resolvedConfigPath
        const resolvedOptionsPath = this.resolvedOptionsPath

        if (this.options.sources) {
            this.watchSource(this.options.sources)
        }

        if (resolvedConfigPath) {
            this.watch('add change unlink', resolvedConfigPath, async () => {
                if (this.options.verbose) {
                    log``
                    log.t`[change] **${this.configPath}**`
                }
                await this.reset()
                this.emit('configChange')
            })
        }

        if (resolvedOptionsPath) {
            this.watch('add change unlink', resolvedOptionsPath, async () => {
                if (this.options.verbose) {
                    log``
                    log.t`[change] **${this.customOptions}**`
                }
                await this.reset()
                this.emit('optionsChange')
            })
        }
    }

    private async disableWatch() {
        if (this.watchers.length) {
            await Promise.all(this.watchers.map(eachWatcher => eachWatcher.removeAllListeners()))
            this.watchers.length = 0
        }
    }

    async startWatch() {
        if (this.watching) return
        this.initWatch()
        this.watching = true
        this.emit('watchStart')
    }

    async closeWatch() {
        if (!this.watching) return
        if (this.watchers.length) {
            await Promise.all(this.watchers.map(eachWatcher => eachWatcher.close()))
            this.watchers.length = 0
        }
        this.watching = false
        this.emit('watchClose')
    }

    /**
     * computed from `options.sources`
     */
    get fixedSourcePaths(): string[] {
        const { sources } = this.options
        return sources?.length
            ? fg.sync(sources, { cwd: this.cwd })
                .filter((eachSourcePath) => !!eachSourcePath)
            : []
    }

    /**
     * resolved from `fixedSourcePaths`
     */
    get resolvedFixedSourcePaths(): string[] {
        return this.fixedSourcePaths.map((eachSourcePath) => upath.resolve(this.cwd, eachSourcePath))
    }

    /**
     * `options.include` - `options.exclude`
     */
    get allowedSourcePaths(): string[] {
        const { include, exclude } = this.options
        return include?.length
            ? fg.sync(include, { cwd: this.cwd, ignore: exclude })
                .filter((eachSourcePath) => !!eachSourcePath)
            : []
    }

    /**
     * resolved from `allowedSourcePaths`
     */
    get resolvedAllowedSourcePaths(): string[] {
        return this.allowedSourcePaths.map((eachSourcePath) => upath.resolve(this.cwd, eachSourcePath))
    }

    isSourceAllowed(source: string): boolean {
        const { include, exclude, sources } = this.options
        for (const eachSource of sources) {
            if (minimatch(source, eachSource)) return true
        }
        for (const eachIncludePattern of include) {
            if (!minimatch(source, eachIncludePattern)) return false
        }
        for (const eachExcludePattern of exclude) {
            if (minimatch(source, eachExcludePattern)) return false
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
    get configPath(): string {
        if (typeof this.options.config === 'string' || Array.isArray(this.options.config)) {
            return exploreConfigPath(this.options.config)
        }
    }

    /**
     * computed from string `options.config`
    */
    get resolvedConfigPath(): string {
        if (typeof this.options.config === 'string' || Array.isArray(this.options.config)) {
            return exploreResolvedConfigPath(this.options.config, { cwd: this.cwd })
        }
    }

    /**
     * computed from string `customOptions`
    */
    get optionsPath(): string {
        if (typeof this.customOptions === 'string' || Array.isArray(this.customOptions)) {
            return exploreConfigPath(this.customOptions)
        }
    }

    /**
     * computed from string `customOptions`
    */
    get resolvedOptionsPath(): string {
        if (typeof this.customOptions === 'string' || Array.isArray(this.customOptions)) {
            return exploreResolvedConfigPath(this.customOptions, { cwd: this.cwd })
        }
    }

    get cwd(): string {
        return this.options.cwd || process.cwd()
    }
}
