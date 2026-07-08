import scannerOptions, { type ScannerOptions } from './options'
import { MasterCSS } from '@master/css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createRequire } from 'node:module'
import {
  extractClassCandidates,
  astroAdapter,
  htmlAdapter,
  matchesSourceAdapter,
  oxcAdapter,
  svelteAdapter,
  vueAdapter,
  type SourceAdapter
} from '@master/css-source'
import { Minimatch } from 'minimatch'
import { createConsola } from 'consola'
import { defu } from 'defu'
import { createCSSWithNativeDeclarations, generateValidRules } from '@master/css-validator'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { cssEscape } from '@master/css-lexer'
import path from 'path'
import {
  createClassExclusionMatcher,
  isClassExcludedByMatcher,
  type ClassExclusionMatcher
} from './utils/class-exclusion'

const builtInAdapters = [
  vueAdapter(),
  svelteAdapter(),
  astroAdapter(),
  htmlAdapter(),
  oxcAdapter()
]

const sourceLikeExtensions = new Set([
  '.html',
  '.htm',
  '.js',
  '.jsx',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.svelte',
  '.astro',
  '.vue',
  '.md',
  '.mdx',
  '.pug',
  '.php'
])

const sourceMatchOptions = { dot: true }
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest
const logger = createConsola({ level: 3 })

interface SourceMatchers {
  exclude: Minimatch[]
}

interface ScannerResetOptions {
  emit?: boolean
}

function createSourceMatchers(patterns?: ScannerOptions['exclude']) {
  return (patterns || []).map((pattern) => new Minimatch(String(pattern), sourceMatchOptions))
}

function matchesAnySource(sources: string[], matchers: Minimatch[]) {
  for (const matcher of matchers) {
    for (const source of sources) {
      if (matcher.match(source)) return true
    }
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

function isSourceLikeModule(source: string) {
  return sourceLikeExtensions.has(path.extname(cleanSourceRequest(source)))
}

function toPosixPath(source: string) {
  return source.replace(/\\/g, '/')
}

function isRelativeToCwd(source: string) {
  return source !== ''
    && !source.startsWith('..')
    && !path.isAbsolute(source)
}

function createSourceMatchCandidates(source: string, cwd: string) {
  const cleanSource = cleanSourceRequest(source)
  const candidates = [toPosixPath(cleanSource)]

  if (path.isAbsolute(cleanSource)) {
    const relativeSource = path.relative(path.resolve(cwd), cleanSource)
    if (isRelativeToCwd(relativeSource)) {
      const normalizedRelativeSource = toPosixPath(relativeSource)
      if (!candidates.includes(normalizedRelativeSource)) {
        candidates.push(normalizedRelativeSource)
      }
    }
  }

  return candidates
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default class CSSScanner extends EventEmitter {
  latentClasses = new Set<string>()
  validClasses = new Set<string>()
  invalidClasses = new Set<string>()
  nativeClassNames = new Set<string>()
  usedNativeClasses = new Set<string>()
  initialized = false
  initializing?: Promise<this>
  resetDependencies: string[] = []

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

  /** Precompiled minimatch patterns for per-module allow/exclude checks. */
  private sourceMatchers?: SourceMatchers
  private sourceMatcherOptions?: Pick<ScannerOptions, 'exclude'>
  /** Memoized adapter list so per-file extraction does not rebuild it. */
  private sourceAdapters?: SourceAdapter[]
  private sourceAdapterOptions?: ScannerOptions['adapters']
  /** Pre-split class exclusion matchers for `scan()` hot path. */
  private classExclusionMatcher?: ClassExclusionMatcher
  private classExclusionOptions?: ScannerOptions['blocklist']

  constructor(
    public customOptions: ScannerOptions = {},
    public cwd = process.cwd()
  ) {
    super()
  }

  init(customOptions: ScannerOptions = this.customOptions) {
    if (this.initialized) return Promise.resolve(this)
    if (this.initializing) return this.initializing
    return this.initializing = this.initInternal(customOptions)
      .finally(() => {
        this.initializing = undefined
      })
  }

  private async initInternal(customOptions: ScannerOptions = this.customOptions) {
    if (typeof customOptions !== 'object' || customOptions === null || Array.isArray(customOptions)) {
      throw new TypeError('CSSScanner options must be an object.')
    }
    this.options = defu(customOptions, scannerOptions) as ScannerOptions
    if (this.options.verbose && this.options.verbose > 1) {
      logger.success('options')
      logger.log(this.options)
      logger.log('')
    }
    this.resetDependencies = []
    this.sourceMatchers = undefined
    this.sourceMatcherOptions = undefined
    this.sourceAdapters = undefined
    this.sourceAdapterOptions = undefined
    this.classExclusionMatcher = undefined
    this.classExclusionOptions = undefined
    this.nativeClassNames = new Set()
    this.css = createCSSWithNativeDeclarations(this.options.manifest || defaultManifest)
    this.insertSafelist()
    this.emit('init', this.options, this.manifest)
    this.initialized = true
    return this
  }

  async reset(
    customOptions: ScannerOptions = this.customOptions,
    resetOptions: ScannerResetOptions = {}
  ) {
    this.latentClasses.clear()
    this.validClasses.clear()
    this.invalidClasses.clear()
    this.nativeClassNames.clear()
    this.usedNativeClasses.clear()
    this.contentHashes.clear()
    this.validRulesCache.clear()
    this.resetDependencies = []
    this.sourceMatchers = undefined
    this.sourceMatcherOptions = undefined
    this.sourceAdapters = undefined
    this.sourceAdapterOptions = undefined
    this.classExclusionMatcher = undefined
    this.classExclusionOptions = undefined
    this.initialized = false
    this.initializing = undefined
    await this.init(customOptions)
    if (resetOptions.emit !== false) {
      this.emit('reset')
    }
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
    this.resetDependencies = []
    this.sourceMatchers = undefined
    this.sourceMatcherOptions = undefined
    this.sourceAdapters = undefined
    this.sourceAdapterOptions = undefined
    this.classExclusionMatcher = undefined
    this.classExclusionOptions = undefined
    this.removeAllListeners()
    this.emit('destroy')
    return this
  }

  private insertSafelist() {
    if (this.options.safelist?.length) {
      for (const eachFixedClass of this.options.safelist) {
        this.css.ensureClassRules(eachFixedClass)
      }
      if (this.options.verbose) {
        logger.success(`${this.options.safelist.length} fixed classes inserted ${this.options.safelist.join(', ')}`)
      }
    }
  }

  /**
   * @description Extract source content candidates.
   * @param source
   * @param content
   * @returns Promise<string[]> Latent classes
   */
  async collectCandidates(source: string, content: string): Promise<string[]> {
    if (!source || !content) {
      return []
    }
    const adapter = this.resolveSourceAdapter(source)
    const extractedClasses = adapter
      ? await adapter.extract({ source, content })
      : extractClassCandidates(content)
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
   * @description Extract trusted content candidates and scan.
   * @param source
   * @param content
   * @returns string[] Latent classes
   */
  async scan(source: string, content: string): Promise<boolean> {
    if (!content) {
      return false
    }

    // Skip the whole pipeline when this exact (source, content) pair has
    // already been processed. HMR commonly re-fires unchanged files; vite
    // can also call `transform` on the same module twice. Hashing 1 KB of
    // source via SHA-1 is ~2 µs; running scan + validate on it is ms.
    if (source) {
      const hash = createHash('sha1').update(content).digest('hex')
      if (this.contentHashes.get(source) === hash) {
        return false
      }
      this.contentHashes.set(source, hash)
    }

    const allLatent = await this.collectCandidates(source, content)
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
        logger.success(`${path.relative(this.cwd, source)} ${changedClasses.length} classes inserted in ${spent}ms ${this.options.verbose > 1 ? changedClasses.join(', ') : ''}`)
      }
      this.emit('change')
    }
    return true
  }

  async scanModule(source: string, content: string): Promise<boolean> {
    if (!this.isModuleAllowed(source)) return false
    return this.scan(source, content)
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
    const { exclude } = this.options
    if (
      !this.sourceMatchers ||
      this.sourceMatcherOptions?.exclude !== exclude
    ) {
      this.sourceMatcherOptions = { exclude }
      this.sourceMatchers = {
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

  isModuleAllowed(source: string): boolean {
    if (!source || source.startsWith('\0')) return false
    if (isStyleModuleRequest(source)) return false
    if (!isSourceLikeModule(source)) return false
    const sources = createSourceMatchCandidates(source, this.cwd)
    const { exclude } = this.getSourceMatchers()
    if (exclude.length && matchesAnySource(sources, exclude)) {
      return false
    }
    return true
  }

  /**
   * computed from `options.manifest`
   */
  get manifest(): MasterCSSManifest {
    return this.css.manifest
  }

  get slotCSSRule(): string {
    return '#' + cssEscape('master-css-slot') + '{--slot:0}'
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default interface CSSScanner {
  css: MasterCSS
  options: ScannerOptions
}
