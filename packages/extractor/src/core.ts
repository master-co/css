import { default as defaultOptions, Options } from './options'
import { createCSS, MasterCSS } from '@master/css'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import { createRequire } from 'node:module'
import { extractLatentClasses } from '@master/css-lexer'
import fs from 'fs'
import { Minimatch } from 'minimatch'
import log from '@techor/log'
import extend from '@techor/extend'
import { generateValidRules } from '@master/css-validator'
import chokidar, { type ChokidarOptions, type FSWatcher } from 'chokidar'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import cssEscape from 'shared/utils/css-escape'
import { explorePathsSync } from '@techor/glob'
import path from 'path'
import { Stats } from 'node:fs'
import bytes from 'bytes'
import { createExtractorDirectives, type ExtractorDirectives } from './directives'
import {
    htmlAdapter,
    matchesSourceAdapter,
    oxcAdapter,
    type SourceAdapter
} from './adapters'
import {
    createClassExclusionMatcher,
    isClassExcludedByMatcher,
    type ClassExclusionMatcher
} from './utils/class-exclusion'

const builtInAdapters = [
    htmlAdapter(),
    oxcAdapter()
]

const sourceMatchOptions = { dot: true }
const require = createRequire(import.meta.url)
const defaultPlan = require('@master/css-preset/default-plan.json') as MasterCSSPlan

interface SourceMatchers {
    required: Minimatch[]
    include: Minimatch[]
    exclude: Minimatch[]
}

function createSourceMatchers(patterns?: Options['include']) {
    return (patterns || []).map((pattern) => new Minimatch(String(pattern), sourceMatchOptions))
}

function matchesAnySource(source: string, matchers: Minimatch[]) {
    for (const matcher of matchers) {
        if (matcher.match(source)) return true
    }
    return false
}

function isStyleModuleRequest(source: string) {
    const queryStart = source.indexOf('?')
    if (queryStart === -1) return false
    return new URLSearchParams(source.slice(queryStart + 1)).get('type') === 'style'
}

function cleanSourceRequest(source: string) {
    const queryStart = source.indexOf('?')
    return queryStart === -1 ? source : source.slice(0, queryStart)
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default class CSSExtractor extends EventEmitter {
    latentClasses = new Set<string>()
    validClasses = new Set<string>()
    invalidClasses = new Set<string>()
    nativeClassNames = new Set<string>()
    usedNativeClasses = new Set<string>()
    watching = false
    watchers: FSWatcher[] = []
    initialized = false
    initializing?: Promise<this>
    planDependencies: string[] = []
    extractorDirectives: ExtractorDirectives = createExtractorDirectives()

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
    /** Precompiled minimatch patterns for per-module allow/exclude checks. */
    private sourceMatchers?: SourceMatchers
    private sourceMatcherOptions?: Pick<Options, 'required' | 'include' | 'exclude'>
    /** Memoized adapter list so per-file extraction does not rebuild it. */
    private sourceAdapters?: SourceAdapter[]
    private sourceAdapterOptions?: Options['adapters']
    /** Pre-split class exclusion matchers for `insert()` hot path. */
    private classExclusionMatcher?: ClassExclusionMatcher
    private classExclusionOptions?: Options['blocklist']

    constructor(
        public customOptions: Options = {},
        public cwd = process.cwd()
    ) {
        super()
    }

    init(customOptions: Options = this.customOptions) {
        if (this.initialized) return Promise.resolve(this)
        if (this.initializing) return this.initializing
        return this.initializing = this.initInternal(customOptions)
            .finally(() => {
                this.initializing = undefined
            })
    }

    private async initInternal(customOptions: Options = this.customOptions) {
        if (typeof customOptions !== 'object' || customOptions === null || Array.isArray(customOptions)) {
            throw new TypeError('CSSExtractor options must be an object.')
        }
        this.options = extend(defaultOptions, customOptions)
        if (this.options.verbose && this.options.verbose > 1) {
            log.ok`**options**`
            log.tree(this.options)
            log``
        }
        this.extractorDirectives = createExtractorDirectives()
        this.planDependencies = []
        this.sourceMatchers = undefined
        this.sourceMatcherOptions = undefined
        this.sourceAdapters = undefined
        this.sourceAdapterOptions = undefined
        this.classExclusionMatcher = undefined
        this.classExclusionOptions = undefined
        this.nativeClassNames = new Set()
        this.css = createCSS(this.options.plan || defaultPlan)
        this.emit('init', this.options, this.plan)
        this.initialized = true
        return this
    }

    async reset(customOptions: Options = this.customOptions) {
        const watching = this.watching
        if (watching) await this.closeWatch({ emit: false })
        this.latentClasses.clear()
        this.validClasses.clear()
        this.invalidClasses.clear()
        this.nativeClassNames.clear()
        this.usedNativeClasses.clear()
        this.contentHashes.clear()
        this.validRulesCache.clear()
        this.planDependencies = []
        this.extractorDirectives = createExtractorDirectives()
        this.cachedFixedSourcePaths = undefined
        this.cachedAllowedSourcePaths = undefined
        this.sourceMatchers = undefined
        this.sourceMatcherOptions = undefined
        this.sourceAdapters = undefined
        this.sourceAdapterOptions = undefined
        this.classExclusionMatcher = undefined
        this.classExclusionOptions = undefined
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
        this.nativeClassNames.clear()
        this.usedNativeClasses.clear()
        this.contentHashes.clear()
        this.validRulesCache.clear()
        this.planDependencies = []
        this.extractorDirectives = createExtractorDirectives()
        this.cachedFixedSourcePaths = undefined
        this.cachedAllowedSourcePaths = undefined
        this.sourceMatchers = undefined
        this.sourceMatcherOptions = undefined
        this.sourceAdapters = undefined
        this.sourceAdapterOptions = undefined
        this.classExclusionMatcher = undefined
        this.classExclusionOptions = undefined
        this.removeAllListeners()
        await this.closeWatch()
        this.emit('destroy')
        return this
    }

    async prepare() {
        /* 插入指定的固定 class */
        if (this.options.safelist?.length) {
            for (const eachFixedClass of this.options.safelist) {
                this.css.add(eachFixedClass)
            }
            if (this.options.verbose) {
                log.ok`${this.options.safelist.length} fixed classes inserted ${this.options.safelist}`
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
        const adapter = this.resolveSourceAdapter(source)
        const extractedClasses = adapter
            ? adapter.extract({ source, content })
            : extractLatentClasses(content)
        const latentClasses: string[] = []
        for (const eachLatentClasses of extractedClasses) {
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
        // allocating a new array). Track native CSS classes separately, then
        // skip generated-rule candidates already known invalid / already
        // known valid / explicitly excluded by blocklist options.
        const latentClasses: string[] = []
        const nativeClasses: string[] = []
        for (const eachLatentClass of allLatent) {
            if (this.isClassExcluded(eachLatentClass)) continue
            if (this.nativeClassNames.has(eachLatentClass) && !this.usedNativeClasses.has(eachLatentClass)) {
                this.usedNativeClasses.add(eachLatentClass)
                nativeClasses.push(eachLatentClass)
            }
            if (this.invalidClasses.has(eachLatentClass)) continue
            if (this.validClasses.has(eachLatentClass)) continue
            latentClasses.push(eachLatentClass)
        }
        if (!latentClasses.length && !nativeClasses.length) {
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
        if (validClasses.length || nativeClasses.length) {
            if (this.options.verbose) {
                time = process.hrtime(time)
                const spent = Math.round(((time[0] * 1e9 + time[1]) / 1e6) * 10) / 10
                const changedClasses = [...validClasses, ...nativeClasses]
                log.ok`**${path.relative(this.cwd, source)}** ${changedClasses.length} classes inserted ${log.chalk.gray('in')} ${spent}ms ${this.options.verbose > 1 ? changedClasses : ''}`
            }
            this.emit('change')
        }
        return true
    }

    resolveSourceAdapter(source: string): SourceAdapter | undefined {
        if (!this.sourceAdapters || this.sourceAdapterOptions !== this.options.adapters) {
            this.sourceAdapterOptions = this.options.adapters
            this.sourceAdapters = [
                ...(this.options.adapters || []),
                ...builtInAdapters
            ]
        }
        const adapters = this.sourceAdapters
        return adapters.find((adapter) => matchesSourceAdapter(adapter, source))
    }

    private getSourceMatchers(): SourceMatchers {
        const { required, include, exclude } = this.options
        if (
            !this.sourceMatchers ||
            this.sourceMatcherOptions?.required !== required ||
            this.sourceMatcherOptions?.include !== include ||
            this.sourceMatcherOptions?.exclude !== exclude
        ) {
            this.sourceMatcherOptions = { required, include, exclude }
            this.sourceMatchers = {
                required: createSourceMatchers(required),
                include: createSourceMatchers(include),
                exclude: createSourceMatchers(exclude)
            }
        }
        return this.sourceMatchers
    }

    private getClassExclusionMatcher(): ClassExclusionMatcher {
        if (!this.classExclusionMatcher || this.classExclusionOptions !== this.options.blocklist) {
            this.classExclusionOptions = this.options.blocklist
            this.classExclusionMatcher = createClassExclusionMatcher(this.options.blocklist)
        }
        return this.classExclusionMatcher
    }

    private isClassExcluded(className: string) {
        return isClassExcludedByMatcher(className, this.getClassExclusionMatcher())
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

        const sourcePaths = this.options.required?.length
            ? this.fixedSourcePaths
            : this.allowedSourcePaths
        if (sourcePaths.length) {
            await this.watchSource(sourcePaths)
        }

        if (this.planDependencies.length) {
            await this.watch('add change unlink', this.planDependencies, async (planDependency) => {
                if (this.options.verbose) {
                    log``
                    const changedPlanPath = path.isAbsolute(planDependency)
                        ? path.relative(this.cwd, planDependency)
                        : planDependency
                    log`[change] **${changedPlanPath}**`
                }
                await this.reset()
                this.emit('planChange')
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
     * computed from `options.required`. Memoized — each access used to re-glob
     * the filesystem which is expensive on large projects. Cleared on `reset()`.
     */
    get fixedSourcePaths(): string[] {
        if (this.cachedFixedSourcePaths) return this.cachedFixedSourcePaths
        const { required } = this.options
        const computed = required?.length
            ? explorePathsSync(required, { cwd: this.cwd })
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
        if (isStyleModuleRequest(source)) return false
        source = cleanSourceRequest(source)
        const { include, exclude, required } = this.getSourceMatchers()
        if (required.length && matchesAnySource(source, required)) {
            return true
        }
        if (include.length && !matchesAnySource(source, include)) {
            return false
        }
        if (exclude.length && matchesAnySource(source, exclude)) {
            return false
        }
        return true
    }

    /**
     * computed from `options.plan`
     */
    get plan(): MasterCSSPlan {
        return this.css.plan
    }

    get slotCSSRule(): string {
        return '#' + cssEscape('master-css-slot') + '{--slot:0}'
    }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default interface CSSExtractor {
    css: MasterCSS
    options: Options
    extractorDirectives: ExtractorDirectives
}
