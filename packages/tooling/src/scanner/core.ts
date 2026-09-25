import { SourcePolicy } from './source-policy'
import type { ScannerSourceOptions, ScannerSourceInput } from './binding-session'
export type { ScannerSourceOptions, ScannerSourceInput } from './binding-session'
import {
  defaultScannerOptions,
  type MasterCSSScannerOptions,
  type MasterCSSScannerConfiguration
} from './options'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  matchesSourceAdapter,
  type SourceAdapter
} from '../source/adapters/types'
import { svelteAdapter } from '../source/adapters/svelte'
import { vueAdapter } from '../source/adapters/vue'
import { Minimatch } from 'minimatch'
import { createConsola } from 'consola'
import { defu } from 'defu'
import { EventEmitter } from 'node:events'
import path from 'path'
import {
  createScannerSession,
  serializeScannerBlocklist,
  type BindingScannerSession,
  type BindingScannerState
} from './binding-session'

const builtInAdapters = [
  vueAdapter(),
  svelteAdapter()
]

const sourceLikeExtensions = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
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
const logger = createConsola({ level: 3 })

interface SourceMatchers {
  exclude: Minimatch[]
}

interface ScannerResetOptions {
  emit?: boolean
}

export interface MasterCSSScannerSourceResult {
  readonly changed: boolean
  readonly sourceChanged: boolean
  /** All candidates extracted from this input, including previously scanned classes. */
  readonly candidates: readonly string[]
}

function createSourceMatchers(patterns?: MasterCSSScannerConfiguration['exclude']) {
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
  constructor(readonly scanner: MasterCSSScanner) { }

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
        .filter((
          { layer }: BindingScannerState['engine']['rules'][number]
        ) => layer === 'utilities')
        .map((
          rule: BindingScannerState['engine']['rules'][number]
        ) => ({ ...rule, name: rule.className }))
    }
  }
}

export class ScannerStateSetView {
  readonly [Symbol.toStringTag] = 'ScannerStateSetView'

  constructor(private readonly readValues: () => readonly string[]) { }

  get size() {
    return this.readValues().length
  }

  has(value: string) {
    return this.readValues().includes(value)
  }

  entries(): SetIterator<[string, string]> {
    return new Set(this.readValues()).entries()
  }

  keys(): SetIterator<string> {
    return this.readValues()[Symbol.iterator]() as SetIterator<string>
  }

  valuesIterator(): SetIterator<string> {
    return this.keys()
  }

  values(): SetIterator<string> {
    return this.keys()
  }

  forEach(callbackfn: (value: string, value2: string, set: ScannerStateSetView) => void, thisArg?: unknown) {
    for (const value of this.values()) callbackfn.call(thisArg, value, value, this)
  }

  [Symbol.iterator](): SetIterator<string> {
    return this.keys()
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MasterCSSScanner extends EventEmitter implements AsyncDisposable {
  readonly latentClasses = new ScannerStateSetView(() => this.state.latentClasses)
  readonly validClasses = new ScannerStateSetView(() => this.state.validClasses)
  readonly invalidClasses = new ScannerStateSetView(() => this.state.invalidClasses)
  readonly nativeClassNames = new ScannerStateSetView(() => this.state.nativeClasses || [])
  readonly usedNativeClasses = new ScannerStateSetView(() => this.state.usedNativeClasses || [])
  /** Current successful source snapshot, including empty and virtual inputs. */
  get sources() { return this.state.sources }
  initialized = false
  initializing?: Promise<this>
  resetDependencies: string[] = []
  readonly css = new ScannerCSSView(this)
  private bindingSession?: BindingScannerSession
  private bindingState?: BindingScannerState
  private currentManifest: MasterCSSManifest
  private lifecycleGeneration = 0
  private sourcePolicy?: SourcePolicy
  private sourceRevisions = new Map<string, number>()
  private ownerRevisions = new Map<string, number>()
  private ownerSnapshots = new Map<string, Promise<unknown>>()
  private sourceParents = new Map<string, string>()
  private committedSources = new Map<string, string>()
  private extractionCache = new Map<string, { content: string, candidates: string[] }>()

  /** Precompiled minimatch patterns for per-module allow/exclude checks. */
  private sourceMatchers?: SourceMatchers
  private sourceMatcherOptions?: Pick<MasterCSSScannerConfiguration, 'exclude'>

  constructor(
    public customOptions: MasterCSSScannerOptions,
    public cwd = process.cwd()
  ) {
    super()
    this.currentManifest = customOptions.manifest
  }

  init(customOptions: MasterCSSScannerOptions = this.customOptions) {
    if (this.initialized) return Promise.resolve(this)
    if (this.initializing) return this.initializing
    const generation = ++this.lifecycleGeneration
    let initializing: Promise<this>
    initializing = this.initInternal(customOptions, generation)
      .finally(() => {
        if (this.initializing === initializing) this.initializing = undefined
      })
    this.initializing = initializing
    return initializing
  }

  private async initInternal(
    customOptions: MasterCSSScannerOptions,
    generation: number
  ) {
    if (typeof customOptions !== 'object' || customOptions === null || Array.isArray(customOptions)) {
      throw new TypeError('MasterCSSScanner options must be an object.')
    }
    const options = defu(customOptions, defaultScannerOptions) as MasterCSSScannerOptions
    if (options.verbose && options.verbose > 1) {
      logger.success('options')
      logger.log(options)
      logger.log('')
    }
    const bindingSession = await createScannerSession(options.manifest, {
      binding: options.binding,
      native: options.native,
      wasm: options.wasm
    })
    if (generation !== this.lifecycleGeneration) {
      bindingSession.dispose()
      return this
    }
    this.options = options
    this.customOptions = customOptions
    this.resetDependencies = []
    this.committedSources.clear()
    this.extractionCache.clear()
    this.sourceRevisions.clear()
    this.ownerRevisions.clear()
    this.ownerSnapshots.clear()
    this.sourceParents.clear()
    this.sourceMatchers = undefined
    this.sourceMatcherOptions = { exclude: options.exclude }
    this.getSourceMatchers()
    this.currentManifest = options.manifest
    this.bindingSession = bindingSession
    try {
      this.insertSafelist()
      this.emit('init', options, this.manifest)
      if (generation === this.lifecycleGeneration) this.initialized = true
    } catch (error) {
      if (this.bindingSession === bindingSession) {
        this.bindingSession = undefined
        this.bindingState = undefined
        this.initialized = false
        bindingSession.dispose()
      }
      throw error
    }
    return this
  }

  async reset(
    customOptions: MasterCSSScannerOptions = this.customOptions,
    resetOptions: ScannerResetOptions = {}
  ) {
    this.lifecycleGeneration++
    this.bindingSession?.dispose()
    this.bindingSession = undefined
    this.bindingState = undefined
    this.resetDependencies = []
    this.committedSources.clear()
    this.extractionCache.clear()
    this.sourceRevisions.clear()
    this.ownerRevisions.clear()
    this.ownerSnapshots.clear()
    this.sourceParents.clear()
    this.sourceMatchers = undefined
    this.sourceMatcherOptions = undefined
    this.initialized = false
    this.initializing = undefined
    const initializing = this.init(customOptions)
    const generation = this.lifecycleGeneration
    await initializing
    if (generation === this.lifecycleGeneration
      && this.initialized
      && resetOptions.emit !== false) {
      this.emit('reset')
    }
    return this
  }

  async dispose() {
    this.lifecycleGeneration++
    const bindingSession = this.bindingSession
    this.bindingSession = undefined
    this.bindingState = undefined
    this.resetDependencies = []
    this.committedSources.clear()
    this.extractionCache.clear()
    this.sourceRevisions.clear()
    this.ownerRevisions.clear()
    this.ownerSnapshots.clear()
    this.sourceParents.clear()
    this.sourceMatchers = undefined
    this.sourceMatcherOptions = undefined
    this.initialized = false
    this.initializing = undefined
    bindingSession?.dispose()
    try {
      this.emit('dispose')
    } finally {
      this.removeAllListeners()
    }
    return this
  }

  async [Symbol.asyncDispose]() {
    await this.dispose()
  }

  private insertSafelist() {
    if (this.options.safelist?.length) {
      this.getBindingSession().ensureClasses([...this.options.safelist])
      this.bindingState = undefined
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
  async collectCandidates(source: string, content: string, options: ScannerSourceOptions = {}): Promise<string[]> {
    return [...await this.extractCandidates(source, content, options)]
  }

  private async extractCandidates(source: string, content: string, options: ScannerSourceOptions) {
    const key = JSON.stringify([options.owner ?? 'project', source, options.kind ?? 'auto', options.extractor ?? ''])
    const cached = this.extractionCache.get(key)
    if (cached?.content === content) return cached.candidates
    const adapter = options.kind && options.kind !== 'auto' ? undefined : this.resolveSourceAdapter(source)
    const candidates = adapter ? await adapter.extract({ source, content }) : this.getBindingSession().extractCandidates(source, content, options)
    this.extractionCache.set(key, { content, candidates })
    return candidates
  }

  async scan(source: string, content: string): Promise<boolean> {
    return (await this.scanSource(source, content)).changed
  }

  async scanSource(source: string, content: string, options: ScannerSourceOptions = {}): Promise<MasterCSSScannerSourceResult> {
    this.getBindingSession()
    const blocklist = serializeScannerBlocklist(this.options.blocklist)
    const key = JSON.stringify([options.owner ?? 'project', source])
    const identity = JSON.stringify([content, options, blocklist])
    const revision = (this.sourceRevisions.get(key) ?? 0) + 1
    this.sourceRevisions.set(key, revision)
    const owner = options.owner ?? 'project'
    const ancestors = this.sourceAncestors(owner, source, new Map([[key, options.parentSource]]))
    const ownerRevision = this.ownerRevisions.get(owner) ?? 0
    const snapshot = this.ownerSnapshots.get(owner)
    const generation = this.lifecycleGeneration
    const candidates = await this.extractCandidates(source, content, options)
    await snapshot?.catch(() => undefined)
    if (ancestors.some(([parent, revision]) => (this.sourceRevisions.get(parent) ?? 0) !== revision)) return { changed: false, sourceChanged: false, candidates }
    if (generation !== this.lifecycleGeneration || revision !== this.sourceRevisions.get(key) || ownerRevision !== (this.ownerRevisions.get(owner) ?? 0)) return { changed: false, sourceChanged: false, candidates }
    if (this.committedSources.get(key) === identity) return { changed: false, sourceChanged: false, candidates }
    const update = this.getBindingSession().scanCandidates(source, content, candidates, blocklist, options)
    if (options.parentSource) this.sourceParents.set(key, options.parentSource)
    else this.sourceParents.delete(key)
    const result = this.applyUpdate(update)
    this.committedSources.set(key, identity)
    return result
  }

  removeSource(source: string, options: ScannerSourceOptions = {}): MasterCSSScannerSourceResult {
    const key = JSON.stringify([options.owner ?? 'project', source])
    this.sourceRevisions.set(key, (this.sourceRevisions.get(key) ?? 0) + 1)
    this.committedSources.clear()
    return this.applyUpdate(this.getBindingSession().removeSource(source, options))
  }

  private sourceAncestors(owner: string, source: string, proposed = new Map<string, string | undefined>()): [string, number][] {
    const ancestors: [string, number][] = []
    const seen = new Set<string>()
    let key = JSON.stringify([owner, source])
    while (!seen.has(key)) {
      seen.add(key)
      ancestors.push([key, this.sourceRevisions.get(key) ?? 0])
      const parent = proposed.has(key) ? proposed.get(key) : this.sourceParents.get(key)
      if (!parent) break
      key = JSON.stringify([owner, parent])
    }
    return ancestors
  }

  reconcileSources(owner: string, inputs: readonly ScannerSourceInput[]): Promise<MasterCSSScannerSourceResult> {
    const task = this.reconcileOwner(owner, inputs)
    this.ownerSnapshots.set(owner, task)
    void task.finally(() => {
      if (this.ownerSnapshots.get(owner) === task) this.ownerSnapshots.delete(owner)
    }).catch(() => undefined)
    return task
  }

  private async reconcileOwner(owner: string, inputs: readonly ScannerSourceInput[]): Promise<MasterCSSScannerSourceResult> {
    const revision = (this.ownerRevisions.get(owner) ?? 0) + 1
    this.ownerRevisions.set(owner, revision)
    const generation = this.lifecycleGeneration
    const proposed = new Map(inputs.map(input => [JSON.stringify([owner, input.source]), input.options?.parentSource]))
    const revisions = new Map(inputs.map(input => [input.source, this.sourceAncestors(owner, input.source, proposed)]))
    const prepared = await Promise.all(inputs.map(async input => {
      const options = { ...input.options, owner }
      return { ...input, options, candidates: input.candidates ?? await this.extractCandidates(input.source, input.content, options), blocklist: input.blocklist ?? serializeScannerBlocklist(this.options.blocklist) }
    }))
    if (generation !== this.lifecycleGeneration || revision !== this.ownerRevisions.get(owner)) return { changed: false, sourceChanged: false, candidates: prepared.flatMap(input => input.candidates) }
    const retained = prepared.filter(input =>
      revisions.get(input.source)!.every(([key, revision]) => (this.sourceRevisions.get(key) ?? 0) === revision)
    )
    const update = this.getBindingSession().reconcileSources(owner, retained)
    this.committedSources.clear()
    for (const key of this.sourceParents.keys()) if (JSON.parse(key)[0] === owner) this.sourceParents.delete(key)
    for (const input of retained) if (input.options.parentSource) this.sourceParents.set(JSON.stringify([owner, input.source]), input.options.parentSource)
    return this.applyUpdate(update)
  }

  removeOwner(owner: string): MasterCSSScannerSourceResult {
    this.ownerRevisions.set(owner, (this.ownerRevisions.get(owner) ?? 0) + 1)
    this.committedSources.clear()
    return this.applyUpdate(this.getBindingSession().removeOwner(owner))
  }

  private applyUpdate(update: import('./binding-session').BindingScannerUpdate): MasterCSSScannerSourceResult {
    this.bindingState = undefined
    const inserted = [...update.validClasses, ...(update.usedNativeClasses ?? [])]
    if (inserted.length && this.options.verbose) logger.success(`${inserted.length} classes inserted${this.options.verbose > 1 ? ' ' + inserted.join(', ') : ''}`)
    if (update.changed) this.emit('change')
    return { changed: update.changed, sourceChanged: update.sourceChanged, candidates: update.candidates }
  }

  async scanModule(source: string, content: string): Promise<boolean> {
    if (!this.isModuleAllowed(source)) return false
    return this.scan(source, content)
  }

  private resolveSourceAdapter(source: string): SourceAdapter | undefined {
    return builtInAdapters.find((adapter) => matchesSourceAdapter(adapter, source))
  }

  private getSourceMatchers(): SourceMatchers {
    const { exclude } = this.options
    if (
      !this.sourceMatchers ||
      this.sourceMatcherOptions?.exclude !== exclude
    ) {
      const explicitExclude = this.sourceMatcherOptions?.exclude !== exclude ? exclude : this.customOptions.exclude
      this.sourcePolicy = new SourcePolicy(this.cwd, { exclude: explicitExclude, outputDirectories: this.options.outputDirectories })
      this.sourceMatcherOptions = { exclude }
      this.sourceMatchers = {
        exclude: createSourceMatchers(exclude)
      }
    }
    return this.sourceMatchers
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
    return this.sourcePolicy?.accepts(cleanSourceRequest(source)) ?? false
  }

  isSourceAllowed(source: string, options: { explicit?: boolean } = {}): boolean {
    this.getSourceMatchers()
    return this.sourcePolicy?.accepts(source, options.explicit) ?? false
  }

  get sourcePolicyDependencies() { return [...(this.sourcePolicy?.dependencies ?? [])] }

  registerNativeClasses(owner: string, classNames: string[]) {
    const changed = this.getBindingSession().registerNativeClasses(owner, classNames)
    this.bindingState = undefined
    if (changed) this.emit('change')
    return changed
  }

  private getBindingSession() {
    if (!this.bindingSession) throw new Error('MasterCSSScanner must be initialized before use.')
    return this.bindingSession
  }

  private syncBindingState() {
    const state = this.getBindingSession().state()
    this.bindingState = state
    return state
  }

  get state() {
    return this.bindingState || this.syncBindingState()
  }

  /**
   * computed from `options.manifest`
   */
  get manifest(): MasterCSSManifest {
    return this.currentManifest
  }

  readonly slotCSSRule = '#master-css-slot{--slot:0}'
}

export async function createScanner(
  options: MasterCSSScannerOptions,
  cwd = process.cwd()
) {
  return await new MasterCSSScanner(options, cwd).init()
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface MasterCSSScanner {
  options: MasterCSSScannerOptions
}
