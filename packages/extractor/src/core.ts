import { default as defaultOptions, Options } from './options'
import MasterCSS from '@master/css'
import type { Config } from '@master/css'
import extractLatentClasses from './functions/extract-latent-classes'
import fs from 'fs'
import { minimatch } from 'minimatch'
import log from '@techor/log'
import extend from '@techor/extend'
import exploreConfig from 'explore-config'
import { generateValidRules } from '@master/css-validator'
import chokidar from 'chokidar'
import { EventEmitter } from 'node:events'
import cssEscape from 'css-shared/utils/css-escape'
import { explorePathsSync, explorePathSync } from '@techor/glob'
import path from 'path'

export default class CSSExtractor extends EventEmitter {
    latentClasses = new Set<string>()
    validClasses = new Set<string>()
    invalidClasses = new Set<string>()
    watching = false
    watchers: chokidar.FSWatcher[] = []

    constructor(
        public customOptions: Options | string | string[] = 'master.css-extractor.*',
        public cwd = process.cwd()
    ) {
        super()
    }

    init(customOptions = this.customOptions) {
        if (typeof customOptions === 'string' || Array.isArray(customOptions)) {
            this.options = extend(defaultOptions, exploreConfig(customOptions, {
                on: {
                    found: (foundPath: string) => log.ok`**${foundPath}** file found`,
                    notFound: () => log.i`No **${customOptions}** file found`
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
        this.css = new MasterCSS(
            typeof this.options.config === 'object'
                ? this.options.config
                : (exploreConfig(this.options.config as string, { cwd: this.cwd }) || {})
        )
        this.emit('init', this.options, this.config)
        return this
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
        await this.closeWatch()
        this.emit('destroy')
        return this
    }

    async prepare() {
        /* 插入指定的固定 class */
        if (this.options.classes?.fixed?.length) {
            for (const eachFixedClass of this.options.classes.fixed) {
                this.css.add(eachFixedClass)
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
                if (this.options.classes?.ignored)
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
        const validClasses: string[] = []

        await Promise.all(
            latentClasses
                .map(async (eachLatentClass) => {
                    const validRules = generateValidRules(eachLatentClass, { css: this.css })
                    if (validRules.length) {
                        for (const validRule of validRules) {
                            this.css.insert(validRule)
                        }
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

    export(filename = this.options.module as string) {
        const filepath = path.resolve(this.cwd, filename)
        const dir = path.dirname(filepath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(filepath, this.css.text)
        if (this.options.verbose) {
            log.success`${this.css.rules.length} rules exported ${log.chalk.gray('in')} **${filename}**`
        }
        this.emit('export', filename, filepath)
    }

    async watchSource(paths: string | readonly string[], watchOptions?: chokidar.WatchOptions): Promise<void> {
        await this.watch('add change', paths, (source) => this.insertFile(source), watchOptions)
    }

    async watch(events: string, paths: string | readonly string[], handle: (path: string, stats?: fs.Stats) => void, watchOptions?: chokidar.WatchOptions): Promise<void> {
        watchOptions = extend({ ignoreInitial: true, cwd: this.cwd }, watchOptions)
        const watcher = chokidar.watch(paths, watchOptions)
        this.watchers.push(watcher)
        events
            .split(' ')
            .forEach((eachEvent) => watcher.on(eachEvent, handle))

        await new Promise<void>(resolve => {
            watcher.once('ready', resolve)
        })
    }

    private async initWatch() {
        const resolvedConfigPath = this.resolvedConfigPath
        const resolvedOptionsPath = this.resolvedOptionsPath

        if (this.options.sources?.length) {
            await this.watchSource(this.options.sources)
        }

        if (resolvedConfigPath) {
            await this.watch('add change unlink', resolvedConfigPath, async () => {
                if (this.options.verbose) {
                    log``
                    log.t`[change] **${this.configPath}**`
                }
                await this.reset()
                this.emit('configChange')
            })
        }

        if (resolvedOptionsPath) {
            await this.watch('add change unlink', resolvedOptionsPath, async () => {
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
        await this.initWatch()
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
            ? explorePathsSync(sources, { cwd: this.cwd })
                .filter((eachSourcePath) => !!eachSourcePath)
            : []
    }

    /**
     * resolved from `fixedSourcePaths`
     */
    get resolvedFixedSourcePaths(): string[] {
        return this.fixedSourcePaths.map((eachSourcePath) => path.resolve(this.cwd, eachSourcePath))
    }

    /**
     * `options.include` - `options.exclude`
     */
    get allowedSourcePaths(): string[] {
        const { include, exclude } = this.options
        return include?.length
            ? explorePathsSync(include, { cwd: this.cwd, ignore: exclude })
                .filter((eachSourcePath) => !!eachSourcePath)
            : []
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
        if (typeof this.options.config === 'string' || Array.isArray(this.options.config)) {
            return explorePathSync(this.options.config, { cwd: this.cwd })
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
        if (typeof this.customOptions === 'string' || Array.isArray(this.customOptions)) {
            return explorePathSync(this.customOptions, { cwd: this.cwd })
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

export default interface CSSExtractor {
    css: MasterCSS
    options: Options
}
