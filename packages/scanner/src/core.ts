import scannerOptions, { type ScannerOptions } from './options'
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
import { EventEmitter } from 'node:events'
import { cssEscape } from '@master/css-lexer'
import path from 'path'
import {
  createClassExclusionMatcher,
  isClassExcludedByMatcher,
  type ClassExclusionMatcher
} from './utils/class-exclusion'
import {
  createRustScannerSession,
  resolveNativeSupport,
  type RustScannerSession,
  type RustScannerStateIR
} from './rust-session'

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

export class ScannerCSSView {
  constructor(readonly scanner: CSSScanner) { }

  get manifest() {
    return this.scanner.manifest
  }

  get settings() {
    return this.manifest.settings
  }

  get text() {
    return this.scanner.state.engine.text
  }

  get utilitiesLayer() {
    return {
      rules: this.scanner.state.engine.rules
        .filter(({ layer }) => layer === 'utilities')
        .map((rule) => ({ ...rule, name: rule.className }))
    }
  }
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
  readonly css = new ScannerCSSView(this)
  private rustSession?: RustScannerSession
  private rustState?: RustScannerStateIR
  private currentManifest: MasterCSSManifest = defaultManifest

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
    this.currentManifest = this.options.manifest || defaultManifest
    this.rustSession = await createRustScannerSession(this.currentManifest)
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
    this.rustSession?.dispose()
    this.rustSession = undefined
    this.rustState = undefined
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
    this.rustSession?.dispose()
    this.rustSession = undefined
    this.rustState = undefined
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
      this.getRustSession().ensureClasses(this.options.safelist)
      this.syncRustState()
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
    const latentClasses = this.getRustSession().collectCandidates(extractedClasses)
    this.syncRustState()
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
    const adapter = this.resolveSourceAdapter(source)
    const extractedClasses = adapter
      ? await adapter.extract({ source, content })
      : extractClassCandidates(content)
    const excludedClasses = extractedClasses.filter((className) => this.isClassExcluded(className))
    const session = this.getRustSession()
    session.registerNativeClasses([...this.nativeClassNames])
    const nativeCandidates = session.nativeDeclarationCandidates(
      extractedClasses.filter((className) => !excludedClasses.includes(className))
    )
    const time = process.hrtime()
    const update = session.scanCandidates(
      source,
      content,
      extractedClasses,
      excludedClasses,
      resolveNativeSupport(nativeCandidates)
    )
    this.syncRustState()
    const changedClasses = [...update.validClasses, ...(update.usedNativeClasses || [])]
    if (changedClasses.length) {
      if (this.options.verbose) {
        const spentTime = process.hrtime(time)
        const spent = Math.round(((spentTime[0] * 1e9 + spentTime[1]) / 1e6) * 10) / 10
        logger.success(`${path.relative(this.cwd, source)} ${changedClasses.length} classes inserted in ${spent}ms ${this.options.verbose > 1 ? changedClasses.join(', ') : ''}`)
      }
      this.emit('change')
    }
    return update.changed
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

  registerNativeClasses(classNames: string[]) {
    const changed = this.getRustSession().registerNativeClasses(classNames)
    this.syncRustState()
    if (changed) this.emit('change')
    return changed
  }

  private getRustSession() {
    if (!this.rustSession) throw new Error('CSSScanner must be initialized before use.')
    return this.rustSession
  }

  private syncRustState() {
    const state = this.getRustSession().state()
    this.rustState = state
    const syncSet = (target: Set<string>, values: string[] | undefined) => {
      target.clear()
      for (const value of values || []) target.add(value)
    }
    syncSet(this.latentClasses, state.latentClasses)
    syncSet(this.validClasses, state.validClasses)
    syncSet(this.invalidClasses, state.invalidClasses)
    syncSet(this.nativeClassNames, state.nativeClasses)
    syncSet(this.usedNativeClasses, state.usedNativeClasses)
    return state
  }

  get state() {
    return this.rustState || this.syncRustState()
  }

  /**
   * computed from `options.manifest`
   */
  get manifest(): MasterCSSManifest {
    return this.currentManifest
  }

  get slotCSSRule(): string {
    return '#' + cssEscape('master-css-slot') + '{--slot:0}'
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default interface CSSScanner {
  options: ScannerOptions
}
