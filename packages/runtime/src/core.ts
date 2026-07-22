import {
  createEngine,
  MasterCSSEngineError,
  type MasterCSSEmittedGlobals,
  type MasterCSSEngine
} from '@master/css-engine'
import type {
  MasterCSSBackend,
  MasterCSSDiagnostic,
  MasterCSSEngineSnapshotIR,
  MasterCSSEngineTransitionIR,
  MasterCSSResolvedBackend
} from '@master/css-schema'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest,
  type MasterCSSManifestUtilityLayerName,
  type MasterCSSManifestVariableEntry
} from '@master/css-schema/manifest'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  type MasterCSSGeneratedRuleIR,
  type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import RuntimeClassTracker from './class-tracker'
import {
  debugRuntimeCreated,
  debugRuntimeDestroyed,
  debugRuntimeDisconnected,
  debugRuntimeHydrated,
  debugRuntimeMutation,
  debugRuntimeObserved,
  debugRuntimeRefreshed
} from './debuggers'
import HydratedGeneratedRule from './generated-rule'
import RuntimeLayer, { type RuntimeLayerRule, type RuntimeResourceRule } from './layer'
import registerGlobal from './register-global'
import RuntimeThemeLayer from './theme-layer'
import type { HydrateResult } from './types'
import RuntimeUtilityLayer from './utility-layer'

const MASTER_CSS_RUNTIME_STYLE_SELECTOR = `style#${MASTER_CSS_RUNTIME_STYLE_ID}`
const RETAINED_CLASS_RULE_MIN_AGE_MS = 1000
const RETAINED_CLASS_RULE_IDLE_TIMEOUT_MS = 5000
const RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE = 64
const RETAINED_CLASS_RULE_SOFT_TARGET = 128
const RETAINED_CLASS_RULE_HARD_LIMIT = 512
const RETAINED_CLASS_RULE_HARD_RAW_BYTES = 256 * 1024
const LAYER_ORDER = ['theme', 'base', 'defaults', 'components', 'utilities'] as const

interface RetainedClassRule {
  retainedAt: number
  rawBytes: number
  ruleCount: number
}

interface RuntimeCleanupWindow {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
  setTimeout: typeof globalThis.setTimeout
  clearTimeout: typeof globalThis.clearTimeout
}

interface RuntimeKeyframeRule extends RuntimeResourceRule {
  native?: CSSKeyframesRule
}

interface RuntimeNonLayer {
  rules: RuntimeKeyframeRule[]
  tokenCounts: Map<string, number>
}

export interface CSSRuntimeCreateOptions {
  manifest: MasterCSSManifest
  root?: Document | ShadowRoot
  emittedGlobals?: MasterCSSEmittedGlobals
  hydrationManifest?: MasterCSSHydrationManifest
}

export interface CSSRuntimeStartOptions extends CSSRuntimeCreateOptions {
  backend?: MasterCSSBackend
  startupTimeoutMs?: number
  onError?: (diagnostic: MasterCSSDiagnostic) => void
}

export const MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS = 3000

function toStartupDiagnostic(error: unknown): MasterCSSDiagnostic {
  if (error instanceof MasterCSSEngineError) return error.toDiagnostic()
  return {
    code: 'INTERNAL',
    message: error instanceof Error ? error.message : String(error)
  }
}

function isDocumentRoot(root: Document | ShadowRoot): root is Document {
  const rootConstructorName = root?.constructor.name
  return rootConstructorName === 'HTMLDocument' || rootConstructorName === 'Document'
}

function findElementById(root: Document | ShadowRoot, id: string) {
  return isDocumentRoot(root)
    ? root.getElementById(id)
    : root.querySelector(`#${id}`)
}

function getRootHost(root: Document | ShadowRoot) {
  return isDocumentRoot(root) ? root.documentElement : root.host
}

function validateHydrationManifest(hydrationManifest: unknown): MasterCSSHydrationManifest | undefined {
  return (hydrationManifest as MasterCSSHydrationManifest | undefined)?.version === 1
    && Array.isArray((hydrationManifest as MasterCSSHydrationManifest | undefined)?.rules)
    ? hydrationManifest as MasterCSSHydrationManifest
    : undefined
}

function invalidHydrationManifest(message: string, cause?: unknown) {
  return new MasterCSSEngineError('INVALID_HYDRATION_MANIFEST', message, { cause })
}

function parseHydrationManifest(source: string): MasterCSSHydrationManifest {
  try {
    const hydrationManifest = validateHydrationManifest(JSON.parse(source))
    if (hydrationManifest) return hydrationManifest
  } catch (cause) {
    throw invalidHydrationManifest('Cannot parse the Master CSS hydration manifest.', cause)
  }
  throw invalidHydrationManifest('Unsupported Master CSS hydration manifest. Expected version 1.')
}

function readInlineHydrationManifest(root: Document | ShadowRoot): MasterCSSHydrationManifest | undefined {
  const source = findElementById(root, MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)?.textContent?.trim()
  return source ? parseHydrationManifest(source) : undefined
}

function readExternalHydrationManifestSource(root: Document | ShadowRoot) {
  const styleElement = findElementById(root, MASTER_CSS_RUNTIME_STYLE_ID)
  return styleElement?.getAttribute(MASTER_CSS_HYDRATION_MANIFEST_ATTR) || undefined
}

function resolveExternalHydrationManifestURL(root: Document | ShadowRoot, source: string) {
  const ownerDocument = isDocumentRoot(root) ? root : root.ownerDocument
  return new URL(source, ownerDocument.baseURI).href
}

async function importHydrationManifest(url: string): Promise<MasterCSSHydrationManifest> {
  try {
    const loadHydrationManifestModule = globalThis.Function(
      'specifier',
      "return import(specifier, { with: { type: 'json' } })"
    ) as (specifier: string) => Promise<{ default: unknown }>
    const module = await loadHydrationManifestModule(url)
    const hydrationManifest = validateHydrationManifest(module.default)
    if (hydrationManifest) return hydrationManifest
    throw invalidHydrationManifest(`Invalid Master CSS hydration manifest loaded from ${url}.`)
  } catch (cause) {
    if (cause instanceof MasterCSSEngineError) throw cause
    throw invalidHydrationManifest(`Cannot load the Master CSS hydration manifest from ${url}.`, cause)
  }
}

async function resolveHydrationManifest(
  root: Document | ShadowRoot,
  explicit: MasterCSSHydrationManifest | undefined
) {
  if (explicit !== undefined) {
    const hydrationManifest = validateHydrationManifest(explicit)
    if (!hydrationManifest) {
      throw invalidHydrationManifest('Unsupported Master CSS hydration manifest. Expected version 1.')
    }
    return hydrationManifest
  }
  const inline = readInlineHydrationManifest(root)
  if (inline) return inline
  const source = readExternalHydrationManifestSource(root)
  return source
    ? await importHydrationManifest(resolveExternalHydrationManifestURL(root, source))
    : undefined
}

function isLayerBlockRule(rule: CSSRule): rule is CSSLayerBlockRule {
  return rule.constructor.name === 'CSSLayerBlockRule'
}

function isKeyframesRule(rule: CSSRule): rule is CSSKeyframesRule {
  return rule.constructor.name === 'CSSKeyframesRule'
}

function getGeneratedRuleNodeTexts(rule: RuntimeLayerRule) {
  const nodes = 'nodes' in rule ? rule.nodes : undefined
  return nodes?.length ? nodes.map(({ text }) => text) : [rule.text]
}

function extractLayerBody(text: string, layerName: string) {
  const prefix = `@layer ${layerName}{`
  const start = text.indexOf(prefix)
  if (start === -1) return ''
  let depth = 1
  let quote = ''
  for (let index = start + prefix.length; index < text.length; index++) {
    const char = text[index]
    if (quote) {
      if (char === '\\') index++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'') quote = char
    else if (char === '{') depth++
    else if (char === '}' && --depth === 0) return text.slice(start + prefix.length, index)
  }
  return ''
}

function cloneEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals): Required<MasterCSSEmittedGlobals> {
  return {
    variables: { ...(emittedGlobals?.variables || {}) },
    animations: { ...(emittedGlobals?.animations || {}) }
  }
}

export default class CSSRuntime {
  static instances = new WeakMap<Document | ShadowRoot, CSSRuntime>()
  private static starts = new WeakMap<Document | ShadowRoot, Promise<CSSRuntime>>()

  readonly host: Element
  readonly container: HTMLElement | ShadowRoot
  readonly baseLayer = new RuntimeUtilityLayer('base', this)
  readonly themeLayer = new RuntimeThemeLayer('theme', this)
  readonly defaultsLayer = new RuntimeUtilityLayer('defaults', this)
  readonly componentsLayer = new RuntimeUtilityLayer('components', this)
  readonly utilitiesLayer = new RuntimeUtilityLayer('utilities', this)
  readonly classUtilities = new Map<string, HydratedGeneratedRule[]>()
  readonly animationsNonLayer: RuntimeNonLayer = { rules: [], tokenCounts: new Map() }
  readonly classCounts = new Map<string, number>()
  readonly retainedClassNames = new Set<string>()
  readonly emittedGlobals: Required<MasterCSSEmittedGlobals>
  readonly variables = new Map<string, MasterCSSManifestVariableEntry>()
  readonly animations = new Map<string, unknown>()

  manifest: MasterCSSManifest
  style: HTMLStyleElement | null = null
  observer?: MutationObserver
  progressive = false
  observing = false

  private readonly classTracker = new RuntimeClassTracker()
  private readonly pendingAddedClassNames = new Set<string>()
  private readonly pendingRemovedClassNames = new Set<string>()
  private readonly retainedClassRules = new Map<string, RetainedClassRule>()
  private pendingAdditionFrame: number | undefined
  private pendingRemovalFrame: number | undefined
  private pendingRemovalFlushFrame: number | undefined
  private retainedCleanupIdleHandle: number | undefined
  private retainedCleanupTimeoutHandle: ReturnType<typeof globalThis.setTimeout> | undefined
  private hydrationFailureReason?: string

  private constructor(
    public readonly root: Document | ShadowRoot,
    manifest: MasterCSSManifest,
    emittedGlobals: MasterCSSEmittedGlobals | undefined,
    public hydrationManifest: MasterCSSHydrationManifest | undefined,
    readonly backendEngine: MasterCSSEngine
  ) {
    this.manifest = manifest
    this.emittedGlobals = cloneEmittedGlobals(emittedGlobals)
    this.host = getRootHost(root)
    this.container = isDocumentRoot(root) ? root.head : root
    this.loadManifestHostData(manifest)
    this.resetResourceCounts()
  }

  get backend(): MasterCSSResolvedBackend {
    return this.backendEngine.backend
  }

  get text() {
    return this.backendEngine.text
  }

  get rules() {
    const layers = LAYER_ORDER
      .map((name) => this.getLayerByName(name))
      .filter((layer): layer is RuntimeLayer => Boolean(layer?.text))
    return [...layers, ...this.animationsNonLayer.rules]
  }

  static async start(options: CSSRuntimeStartOptions): Promise<CSSRuntime> {
    const root = options.root || document
    const current = CSSRuntime.instances.get(root)
    if (current) {
      current.registerEmittedGlobals(options.emittedGlobals)
      if (options.hydrationManifest !== undefined) current.setHydrationManifest(options.hydrationManifest)
      return current
    }
    const pending = CSSRuntime.starts.get(root)
    if (pending) return await pending

    const startup = CSSRuntime.startNew(root, options)
      .finally(() => CSSRuntime.starts.delete(root))
    CSSRuntime.starts.set(root, startup)
    return await startup
  }

  private static async startNew(root: Document | ShadowRoot, options: CSSRuntimeStartOptions) {
    const {
      backend = 'auto',
      startupTimeoutMs = MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS,
      onError
    } = options
    const ownerWindow = (isDocumentRoot(root) ? root : root.ownerDocument).defaultView || globalThis
    let abandoned = false
    let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | undefined
    const enginePromise = createEngine({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals,
      backend
    }).then((engine) => {
      if (abandoned) engine.dispose()
      return engine
    })
    const hydrationPromise = resolveHydrationManifest(root, options.hydrationManifest)
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = ownerWindow.setTimeout(() => reject(new MasterCSSEngineError(
        'RUNTIME_STARTUP_TIMEOUT',
        `Master CSS runtime did not start within ${startupTimeoutMs}ms.`
      )), startupTimeoutMs)
    })

    try {
      const [engine, hydrationManifest] = await Promise.race([
        Promise.all([enginePromise, hydrationPromise]),
        timeoutPromise
      ])
      if (timeoutHandle !== undefined) ownerWindow.clearTimeout(timeoutHandle)
      return new CSSRuntime(
        root,
        options.manifest,
        options.emittedGlobals,
        hydrationManifest,
        engine
      ).register()
    } catch (error) {
      abandoned = true
      if (timeoutHandle !== undefined) ownerWindow.clearTimeout(timeoutHandle)
      getRootHost(root).removeAttribute('hidden')
      onError?.(toStartupDiagnostic(error))
      throw error
    }
  }

  private loadManifestHostData(manifest: MasterCSSManifest) {
    this.variables.clear()
    for (const variable of flattenMasterCSSManifestVariables(manifest.variables)) {
      this.variables.set(variable.name, variable)
    }
    this.animations.clear()
    for (const [name, animation] of Object.entries(manifest.animations || {})) {
      this.animations.set(name, animation)
    }
  }

  register(): this {
    const registered = CSSRuntime.instances.get(this.root) === this
    CSSRuntime.instances.set(this.root, this)
    if (isDocumentRoot(this.root)) {
      this.root.defaultView!.globalThis.masterCSSRuntime = this
    }
    if (!registered && process.env.NODE_ENV === 'development') debugRuntimeCreated(this)
    return this
  }

  unregister(): this {
    CSSRuntime.instances.delete(this.root)
    if (isDocumentRoot(this.root) && this.root.defaultView!.globalThis.masterCSSRuntime === this) {
      this.root.defaultView!.globalThis.masterCSSRuntime = undefined as unknown as CSSRuntime
    }
    return this
  }

  registerEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals) {
    if (!emittedGlobals) return this
    for (const [name, count] of Object.entries(emittedGlobals.variables || {})) {
      if (count) this.emittedGlobals.variables[name] = (this.emittedGlobals.variables[name] || 0) + count
    }
    for (const [name, count] of Object.entries(emittedGlobals.animations || {})) {
      if (count) this.emittedGlobals.animations[name] = (this.emittedGlobals.animations[name] || 0) + count
    }
    this.resetResourceCounts()
    for (const layer of this.getUtilityLayers()) {
      for (const rule of layer.rules) {
        if (rule instanceof HydratedGeneratedRule) this.updateRuleResourceCounts(rule, 1)
      }
    }
    this.syncResourceRuleState()
    return this
  }

  setHydrationManifest(hydrationManifest?: MasterCSSHydrationManifest): this {
    this.hydrationManifest = hydrationManifest
    return this
  }

  needsHydrationManifest() {
    return this.hydrationManifest === undefined && Boolean(readExternalHydrationManifestSource(this.root))
  }

  async loadHydrationManifest(): Promise<this> {
    this.hydrationManifest = await resolveHydrationManifest(this.root, this.hydrationManifest)
    return this
  }

  private getOwnerDocument() {
    return isDocumentRoot(this.root) ? this.root : this.root.ownerDocument
  }

  private createRuntimeStyle() {
    this.style = this.getOwnerDocument().createElement('style')
    this.style.id = MASTER_CSS_RUNTIME_STYLE_ID
    this.style.setAttribute('blocking', 'render')
    this.container.append(this.style)
  }

  private getStyleSheet() {
    return this.style?.sheet || undefined
  }

  private findTopLevelRuleIndex(rule: CSSRule) {
    const sheet = this.getStyleSheet()
    if (!sheet) return -1
    for (let index = 0; index < sheet.cssRules.length; index++) {
      if (sheet.cssRules.item(index) === rule) return index
    }
    return -1
  }

  private getLayerInsertIndex(name: string) {
    const sheet = this.getStyleSheet()
    if (!sheet) return 0
    const rank = LAYER_ORDER.indexOf(name as typeof LAYER_ORDER[number])
    for (let index = 0; index < sheet.cssRules.length; index++) {
      const rule = sheet.cssRules.item(index)!
      if (isKeyframesRule(rule)) return index
      if (isLayerBlockRule(rule)) {
        const ruleRank = LAYER_ORDER.indexOf(rule.name as typeof LAYER_ORDER[number])
        if (ruleRank > rank) return index
      }
    }
    return sheet.cssRules.length
  }

  private ensureNativeLayer(layer: RuntimeLayer) {
    const sheet = this.getStyleSheet()
    if (!sheet) return
    if (layer.native?.parentStyleSheet) return layer.native
    const insertedIndex = sheet.insertRule(
      `@layer ${layer.name}{}`,
      this.getLayerInsertIndex(layer.name)
    )
    layer.native = sheet.cssRules.item(insertedIndex) as CSSLayerBlockRule
    return layer.native
  }

  insertLayerRule(layer: RuntimeLayer, rule: RuntimeLayerRule, index: number) {
    const nativeLayer = this.ensureNativeLayer(layer)
    if (!nativeLayer) return
    let nativeIndex = 0
    for (let previous = 0; previous < index; previous++) {
      nativeIndex += getGeneratedRuleNodeTexts(layer.rules[previous]).length
    }
    const nodes = 'nodes' in rule ? rule.nodes : undefined
    for (const [nodeIndex, text] of getGeneratedRuleNodeTexts(rule).entries()) {
      try {
        const insertedIndex = nativeLayer.insertRule(text, nativeIndex + nodeIndex)
        const native = nativeLayer.cssRules.item(insertedIndex) || undefined
        if (nodes?.[nodeIndex]) nodes[nodeIndex].native = native
        else rule.native = native
      } catch (error) {
        console.error(error, rule)
      }
    }
  }

  deleteLayerRule(layer: RuntimeLayer, rule: RuntimeLayerRule, index: number) {
    const nativeLayer = layer.native
    if (!nativeLayer) return
    let nativeIndex = 0
    for (let previous = 0; previous < index; previous++) {
      nativeIndex += getGeneratedRuleNodeTexts(layer.rules[previous]).length
    }
    for (let count = getGeneratedRuleNodeTexts(rule).length; count > 0; count--) {
      if (nativeIndex < nativeLayer.cssRules.length) nativeLayer.deleteRule(nativeIndex)
    }
    if (!layer.rules.length) {
      const sheet = this.getStyleSheet()
      const topIndex = this.findTopLevelRuleIndex(nativeLayer)
      if (sheet && topIndex !== -1) sheet.deleteRule(topIndex)
      layer.native = null
    }
  }

  private getLayerByName(name: string): RuntimeLayer | undefined {
    switch (name) {
      case 'theme': return this.themeLayer
      case 'base': return this.baseLayer
      case 'defaults': return this.defaultsLayer
      case 'components': return this.componentsLayer
      case 'utilities': return this.utilitiesLayer
    }
  }

  private getUtilityLayerByName(name: MasterCSSManifestUtilityLayerName) {
    return this.getLayerByName(name) as RuntimeUtilityLayer
  }

  private getUtilityLayers() {
    return [this.baseLayer, this.defaultsLayer, this.componentsLayer, this.utilitiesLayer]
  }

  private setThemeResource(text: string) {
    const sheet = this.getStyleSheet()
    if (sheet && this.themeLayer.native) {
      const index = this.findTopLevelRuleIndex(this.themeLayer.native)
      if (index !== -1) sheet.deleteRule(index)
    }
    this.themeLayer.native = null
    this.themeLayer.resourceText = text
    if (sheet && text) {
      const index = sheet.insertRule(`@layer theme{${text}}`, this.getLayerInsertIndex('theme'))
      this.themeLayer.native = sheet.cssRules.item(index) as CSSLayerBlockRule
    }
    this.syncThemeRules()
  }

  private insertKeyframes(key: string, text: string, index: number) {
    if (this.animationsNonLayer.rules.some((rule) => rule.key === key)) return
    const rule: RuntimeKeyframeRule = { key, name: key, text }
    const boundedIndex = Math.max(0, Math.min(index, this.animationsNonLayer.rules.length))
    this.animationsNonLayer.rules.splice(boundedIndex, 0, rule)
    const sheet = this.getStyleSheet()
    if (!sheet) return
    let keyframesStartIndex = sheet.cssRules.length
    for (let topIndex = 0; topIndex < sheet.cssRules.length; topIndex++) {
      if (isKeyframesRule(sheet.cssRules.item(topIndex)!)) {
        keyframesStartIndex = topIndex
        break
      }
    }
    const topIndex = keyframesStartIndex + boundedIndex
    const insertedIndex = sheet.insertRule(text, Math.min(topIndex, sheet.cssRules.length))
    rule.native = sheet.cssRules.item(insertedIndex) as CSSKeyframesRule
  }

  private deleteKeyframes(key: string, index?: number) {
    const foundIndex = index !== undefined && this.animationsNonLayer.rules[index]?.key === key
      ? index
      : this.animationsNonLayer.rules.findIndex((rule) => rule.key === key)
    if (foundIndex === -1) return
    const [rule] = this.animationsNonLayer.rules.splice(foundIndex, 1)
    if (rule.native) {
      const sheet = this.getStyleSheet()
      const topIndex = this.findTopLevelRuleIndex(rule.native)
      if (sheet && topIndex !== -1) sheet.deleteRule(topIndex)
    }
  }

  private resetHostRuleState() {
    this.classUtilities.clear()
    this.baseLayer.reset()
    this.themeLayer.reset()
    this.defaultsLayer.reset()
    this.componentsLayer.reset()
    this.utilitiesLayer.reset()
    this.animationsNonLayer.rules.length = 0
    this.resetResourceCounts()
  }

  private resetResourceCounts() {
    this.themeLayer.tokenCounts.clear()
    this.animationsNonLayer.tokenCounts.clear()
    for (const [name, count] of Object.entries(this.emittedGlobals.variables)) {
      if (count) this.themeLayer.tokenCounts.set(name, count)
    }
    for (const [name, count] of Object.entries(this.emittedGlobals.animations)) {
      if (count) this.animationsNonLayer.tokenCounts.set(name, count)
    }
  }

  private updateCount(counts: Map<string, number>, name: string, delta: number) {
    const count = (counts.get(name) || 0) + delta
    if (count > 0) counts.set(name, count)
    else counts.delete(name)
  }

  private updateRuleResourceCounts(rule: HydratedGeneratedRule, delta: number) {
    const visited = new Set<string>()
    const updateVariable = (name: string) => {
      if (!name || !visited.add(name)) return
      this.updateCount(this.themeLayer.tokenCounts, name, delta)
      this.variables.get(name)?.dependencies?.forEach(updateVariable)
    }
    rule.variableNames?.forEach(updateVariable)
    rule.animationNames?.forEach((name) => this.updateCount(this.animationsNonLayer.tokenCounts, name, delta))
  }

  private syncThemeRules() {
    this.themeLayer.rules.length = 0
    const seen = new Set<string>()
    for (const match of this.themeLayer.resourceText.matchAll(/--([-_a-zA-Z0-9]+)\s*:/g)) {
      const name = match[1]
      if (!seen.add(name)) continue
      const rule: RuntimeResourceRule = { key: name, name, text: '' }
      this.themeLayer.rules.push(rule)
      if (this.variables.get(name)?.static && !this.themeLayer.tokenCounts.has(name)) {
        this.themeLayer.tokenCounts.set(name, 1)
      }
    }
  }

  private syncResourceRuleState() {
    this.syncThemeRules()
    for (const rule of this.animationsNonLayer.rules) {
      if (!this.animationsNonLayer.tokenCounts.has(rule.name)) {
        this.animationsNonLayer.tokenCounts.set(rule.name, 1)
      }
    }
  }

  private registerClassRule(rule: HydratedGeneratedRule) {
    const rules = this.classUtilities.get(rule.name)
    if (rules) rules.push(rule)
    else this.classUtilities.set(rule.name, [rule])
  }

  private unregisterLayerRule(rule: RuntimeLayerRule) {
    if (!(rule instanceof HydratedGeneratedRule)) return
    this.updateRuleResourceCounts(rule, -1)
    for (const [className, rules] of this.classUtilities) {
      const next = rules.filter((candidate) => candidate !== rule)
      if (next.length) this.classUtilities.set(className, next)
      else this.classUtilities.delete(className)
    }
  }

  private applyTransition(transition: MasterCSSEngineTransitionIR) {
    for (const mutation of transition.mutations) {
      if (mutation.target === 'theme') {
        this.setThemeResource(mutation.op === 'insert' ? mutation.text : '')
        continue
      }
      if (mutation.target === 'keyframes') {
        if (mutation.op === 'insert') this.insertKeyframes(mutation.key, mutation.text, mutation.index)
        else this.deleteKeyframes(mutation.key, mutation.index)
        continue
      }
      const layer = this.getUtilityLayerByName(mutation.target)
      if (mutation.op === 'insert') {
        if (!mutation.rule) {
          throw new MasterCSSEngineError('INTERNAL', `Missing generated rule IR for ${mutation.key}.`)
        }
        const rule = new HydratedGeneratedRule(mutation.rule, layer)
        layer.insert(rule, mutation.index)
        this.updateRuleResourceCounts(rule, 1)
        this.registerClassRule(rule)
      } else {
        const rule = layer.delete(mutation.key, mutation.index)
        if (rule) this.unregisterLayerRule(rule)
      }
    }
    this.syncResourceRuleState()
  }

  private adoptSnapshot(snapshot: MasterCSSEngineSnapshotIR, preserveStyle = false) {
    this.resetHostRuleState()
    if (!this.style) return
    if (!preserveStyle) this.style.textContent = snapshot.text
    const sheet = this.getStyleSheet()
    if (!sheet) return

    const nativeLayers = new Map<string, CSSLayerBlockRule>()
    const nativeKeyframes: CSSKeyframesRule[] = []
    for (const rule of sheet.cssRules) {
      if (isLayerBlockRule(rule)) nativeLayers.set(rule.name, rule)
      else if (isKeyframesRule(rule)) nativeKeyframes.push(rule)
    }
    this.themeLayer.native = nativeLayers.get('theme') || null
    this.themeLayer.resourceText = extractLayerBody(snapshot.text, 'theme')

    const layerNativeIndexes = new Map<string, number>()
    for (const ir of snapshot.rules) {
      const layer = this.getUtilityLayerByName(ir.layer)
      layer.native ||= nativeLayers.get(ir.layer) || null
      const rule = new HydratedGeneratedRule(ir, layer)
      const nativeIndex = layerNativeIndexes.get(ir.layer) || 0
      const nodes = rule.nodes
      if (nodes?.length) {
        for (let index = 0; index < nodes.length; index++) {
          nodes[index].native = layer.native?.cssRules.item(nativeIndex + index) || undefined
        }
      } else {
        rule.native = layer.native?.cssRules.item(nativeIndex) || undefined
      }
      layerNativeIndexes.set(ir.layer, nativeIndex + (nodes?.length || 1))
      layer.rules.push(rule)
      this.updateRuleResourceCounts(rule, 1)
      this.registerClassRule(rule)
    }

    for (const native of nativeKeyframes) {
      this.animationsNonLayer.rules.push({
        key: native.name,
        name: native.name,
        text: native.cssText,
        native
      })
    }
    this.syncResourceRuleState()
  }

  private warnHydrationFallback(reason: string) {
    console.warn(`Master CSS progressive hydration requires a matching hydration manifest. ${reason} Rebuilding ${MASTER_CSS_RUNTIME_STYLE_SELECTOR} with the runtime.`)
  }

  private useRuntimeStyle(connectedNames: Set<string>, reason?: string) {
    if (reason) this.warnHydrationFallback(reason)
    this.style?.remove()
    this.style = null
    this.progressive = false
    this.createRuntimeStyle()
    this.adoptSnapshot(this.backendEngine.snapshot())
    this.ensureClassRules(...connectedNames)
  }

  private detectRuntimeStyle() {
    const style = findElementById(this.root, MASTER_CSS_RUNTIME_STYLE_ID)
    if (style?.constructor.name === 'HTMLStyleElement') {
      this.style = style as HTMLStyleElement
      this.progressive = true
    }
  }

  private collectConnectedClasses() {
    return this.classTracker.collectConnected(this.root, this.classCounts)
  }

  private failHydration(reason: string, ensuredClassNames: string[] = []) {
    this.hydrationFailureReason = reason
    if (ensuredClassNames.length) this.backendEngine.deleteClassRules(ensuredClassNames)
    this.resetHostRuleState()
    return undefined
  }

  private matchesEngineSnapshotText(snapshotText: string) {
    const sheet = this.getStyleSheet()
    if (!sheet) return false
    const expectedStyle = this.getOwnerDocument().createElement('style')
    expectedStyle.media = 'not all'
    expectedStyle.textContent = snapshotText
    this.container.append(expectedStyle)
    try {
      const expectedRules = expectedStyle.sheet?.cssRules
      if (!expectedRules) return false
      const actualRules = [...sheet.cssRules]
      for (const expected of expectedRules) {
        if (isLayerBlockRule(expected)) {
          const actual = actualRules.find((rule) => isLayerBlockRule(rule) && rule.name === expected.name)
          if (!actual || !isLayerBlockRule(actual)) return false
          const actualTexts = [...actual.cssRules].map(({ cssText }) => cssText)
          for (const { cssText } of expected.cssRules) {
            const index = actualTexts.indexOf(cssText)
            if (index === -1) return false
            actualTexts.splice(index, 1)
          }
        } else if (!actualRules.some(({ cssText }) => cssText === expected.cssText)) {
          return false
        }
      }
      return true
    } finally {
      expectedStyle.remove()
    }
  }

  private getHydrationClassNames(rules: MasterCSSGeneratedRuleIR[]) {
    const resourceOrder = new Map<string, number>()
    const source = this.style?.textContent || ''
    for (const match of source.matchAll(/--([-_a-zA-Z0-9]+)\s*:/g)) {
      if (!resourceOrder.has(match[1])) resourceOrder.set(match[1], match.index)
    }
    for (const match of source.matchAll(/@(?:-webkit-)?keyframes\s+([-_a-zA-Z0-9]+)/g)) {
      if (!resourceOrder.has(match[1])) resourceOrder.set(match[1], match.index)
    }
    const classResources = new Map<string, string[]>()
    for (const rule of rules) {
      const resources = classResources.get(rule.className) || []
      for (const name of [...(rule.variableNames || []), ...(rule.animationNames || [])]) {
        if (!resources.includes(name)) resources.push(name)
      }
      classResources.set(rule.className, resources)
    }
    return [...classResources.keys()].sort((left, right) => {
      const getRank = (className: string) => Math.min(
        ...(classResources.get(className) || []).map((name) => resourceOrder.get(name) ?? Number.MAX_SAFE_INTEGER),
        Number.MAX_SAFE_INTEGER
      )
      return getRank(left) - getRank(right)
    })
  }

  hydrate(nativeLayerRules: CSSRuleList): HydrateResult | undefined {
    this.hydrationFailureReason = undefined
    const manifest = this.hydrationManifest
    if (manifest?.version !== 1 || !Array.isArray(manifest.rules)) {
      return this.failHydration('Missing or invalid hydration manifest.')
    }
    if (!manifest.rules.length) {
      return this.failHydration(`Hydration manifest has no generated rules for ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
    }
    const classNames = this.getHydrationClassNames(manifest.rules)
    this.backendEngine.ensureClassRules(classNames)
    const snapshot = this.backendEngine.snapshot()
    if (JSON.stringify(snapshot.rules) !== JSON.stringify(manifest.rules)) {
      return this.failHydration('Generated rules do not match the hydration manifest.', classNames)
    }
    if (!this.matchesEngineSnapshotText(snapshot.text)) {
      return this.failHydration(`${MASTER_CSS_RUNTIME_STYLE_SELECTOR} does not match the Rust engine snapshot.`, classNames)
    }
    if (nativeLayerRules.length !== this.style?.sheet?.cssRules.length) {
      return this.failHydration(`Cannot read ${MASTER_CSS_RUNTIME_STYLE_SELECTOR} CSS rules.`, classNames)
    }
    this.adoptSnapshot(snapshot, true)
    const result = {
      allUtilities: this.getUtilityLayers().flatMap(({ rules }) =>
        rules.filter((rule): rule is HydratedGeneratedRule => rule instanceof HydratedGeneratedRule)
      )
    }
    if (process.env.NODE_ENV === 'development') debugRuntimeHydrated(this, result)
    return result
  }

  private hydrateRuntimeStyle(connectedNames: Set<string>) {
    const hydrateResult = this.style?.sheet && this.hydrate(this.style.sheet.cssRules)
    if (!hydrateResult) {
      this.useRuntimeStyle(
        connectedNames,
        this.hydrationFailureReason || `Cannot read ${MASTER_CSS_RUNTIME_STYLE_SELECTOR} CSS rules.`
      )
      return
    }
    const hydratedClassNames = new Set(hydrateResult.allUtilities.map(({ name }) => name))
    const missing = [...connectedNames].filter((className) => !hydratedClassNames.has(className))
    if (missing.length) this.ensureClassRules(...missing)
  }

  private renderRuntimeStyle(connectedNames: Set<string>) {
    this.createRuntimeStyle()
    this.adoptSnapshot(this.backendEngine.snapshot())
    this.ensureClassRules(...connectedNames)
  }

  private getAnimationFrameWindow() {
    return this.getOwnerDocument().defaultView || globalThis
  }

  private cancelPendingRemovalFrames() {
    const view = this.getAnimationFrameWindow()
    if (this.pendingRemovalFrame !== undefined) view.cancelAnimationFrame(this.pendingRemovalFrame)
    if (this.pendingRemovalFlushFrame !== undefined) view.cancelAnimationFrame(this.pendingRemovalFlushFrame)
    this.pendingRemovalFrame = undefined
    this.pendingRemovalFlushFrame = undefined
  }

  private cancelPendingAdditionFrame() {
    if (this.pendingAdditionFrame === undefined) return
    this.getAnimationFrameWindow().cancelAnimationFrame(this.pendingAdditionFrame)
    this.pendingAdditionFrame = undefined
  }

  private clearPendingAddedClassNames() {
    this.pendingAddedClassNames.clear()
    this.cancelPendingAdditionFrame()
  }

  private clearPendingRemovedClassNames() {
    this.pendingRemovedClassNames.clear()
    this.cancelPendingRemovalFrames()
  }

  private getCleanupWindow() {
    return this.getAnimationFrameWindow() as RuntimeCleanupWindow
  }

  private cancelRetainedClassRuleCleanup() {
    const view = this.getCleanupWindow()
    if (this.retainedCleanupIdleHandle !== undefined) {
      view.cancelIdleCallback?.(this.retainedCleanupIdleHandle)
      this.retainedCleanupIdleHandle = undefined
    }
    if (this.retainedCleanupTimeoutHandle !== undefined) {
      view.clearTimeout(this.retainedCleanupTimeoutHandle)
      this.retainedCleanupTimeoutHandle = undefined
    }
  }

  private clearRetainedClassRules() {
    this.retainedClassNames.clear()
    this.retainedClassRules.clear()
    this.cancelRetainedClassRuleCleanup()
  }

  private cancelPendingRemovedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) this.pendingRemovedClassNames.delete(className)
    if (!this.pendingRemovedClassNames.size) this.cancelPendingRemovalFrames()
  }

  private cancelPendingAddedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) this.pendingAddedClassNames.delete(className)
    if (!this.pendingAddedClassNames.size) this.cancelPendingAdditionFrame()
  }

  private cancelRetainedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) {
      this.retainedClassNames.delete(className)
      this.retainedClassRules.delete(className)
    }
    if (!this.retainedClassNames.size) this.cancelRetainedClassRuleCleanup()
  }

  private schedulePendingRemovalFlush() {
    if (!this.pendingRemovedClassNames.size
      || this.pendingRemovalFrame !== undefined
      || this.pendingRemovalFlushFrame !== undefined) return
    const view = this.getAnimationFrameWindow()
    this.pendingRemovalFrame = view.requestAnimationFrame(() => {
      this.pendingRemovalFrame = undefined
      this.pendingRemovalFlushFrame = view.requestAnimationFrame(() => {
        this.pendingRemovalFlushFrame = undefined
        this.flushPendingRemovedClassNames()
      })
    })
  }

  private queueRemovedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) {
      if (!this.classCounts.has(className)) this.pendingRemovedClassNames.add(className)
    }
    this.schedulePendingRemovalFlush()
  }

  private schedulePendingAdditionFlush() {
    if (!this.pendingAddedClassNames.size || this.pendingAdditionFrame !== undefined) return
    this.pendingAdditionFrame = this.getAnimationFrameWindow().requestAnimationFrame(() => {
      this.pendingAdditionFrame = undefined
      this.flushPendingAddedClassNames()
    })
  }

  private queueAddedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) {
      if (this.classCounts.has(className)) this.pendingAddedClassNames.add(className)
    }
    this.schedulePendingAdditionFlush()
  }

  private estimateRetainedClassRule(className: string): RetainedClassRule | undefined {
    const rules = this.classUtilities.get(className)
    if (!rules?.length) return
    let rawBytes = 0
    let ruleCount = 0
    for (const rule of rules) {
      const texts = getGeneratedRuleNodeTexts(rule)
      rawBytes += texts.reduce((length, text) => length + text.length, 0)
      ruleCount += texts.length
    }
    return { retainedAt: Date.now(), rawBytes, ruleCount }
  }

  private getRetainedClassRuleRawBytes() {
    let rawBytes = 0
    for (const retainedRule of this.retainedClassRules.values()) rawBytes += retainedRule.rawBytes
    return rawBytes
  }

  private exceedsRetainedClassRuleHardLimits() {
    return this.retainedClassNames.size > RETAINED_CLASS_RULE_HARD_LIMIT
      || this.getRetainedClassRuleRawBytes() > RETAINED_CLASS_RULE_HARD_RAW_BYTES
  }

  private scheduleRetainedClassRuleCleanup() {
    if (!this.retainedClassNames.size
      || this.retainedCleanupIdleHandle !== undefined
      || this.retainedCleanupTimeoutHandle !== undefined) return
    const view = this.getCleanupWindow()
    const timeout = this.exceedsRetainedClassRuleHardLimits() ? 0 : RETAINED_CLASS_RULE_IDLE_TIMEOUT_MS
    const cleanup = () => {
      this.retainedCleanupIdleHandle = undefined
      this.retainedCleanupTimeoutHandle = undefined
      this.cleanupRetainedClassRules()
    }
    if (view.requestIdleCallback) {
      this.retainedCleanupIdleHandle = view.requestIdleCallback(cleanup, { timeout })
    } else {
      this.retainedCleanupTimeoutHandle = view.setTimeout(cleanup, timeout)
    }
  }

  private retainRemovedClassRules(classNames: string[]) {
    for (const className of classNames) {
      if (this.classCounts.has(className)) continue
      const retainedRule = this.retainedClassRules.get(className) || this.estimateRetainedClassRule(className)
      if (!retainedRule) continue
      this.retainedClassNames.add(className)
      this.retainedClassRules.set(className, retainedRule)
    }
    this.scheduleRetainedClassRuleCleanup()
  }

  private getRetainedClassRuleCleanupCandidates(force = false) {
    const now = Date.now()
    const hardLimitExceeded = this.exceedsRetainedClassRuleHardLimits()
    const entries: [string, RetainedClassRule][] = []
    for (const className of this.retainedClassNames) {
      if (this.classCounts.has(className)) {
        this.retainedClassNames.delete(className)
        this.retainedClassRules.delete(className)
        continue
      }
      const retainedRule = this.retainedClassRules.get(className)
      if (!retainedRule) continue
      const oldEnough = now - retainedRule.retainedAt >= RETAINED_CLASS_RULE_MIN_AGE_MS
      if (force || hardLimitExceeded
        || (oldEnough && this.retainedClassNames.size > RETAINED_CLASS_RULE_SOFT_TARGET)) {
        entries.push([className, retainedRule])
      }
    }
    entries.sort(([, left], [, right]) => left.retainedAt - right.retainedAt)
    const cleanupCount = hardLimitExceeded
      ? Math.max(RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE, this.retainedClassNames.size - RETAINED_CLASS_RULE_SOFT_TARGET)
      : RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE
    return entries.slice(0, force ? entries.length : cleanupCount).map(([className]) => className)
  }

  private removeRetainedClassRules(classNames: string[]) {
    const removedClassNames: string[] = []
    for (const className of classNames) {
      if (!this.retainedClassNames.has(className)) continue
      this.retainedClassNames.delete(className)
      this.retainedClassRules.delete(className)
      if (!this.classCounts.has(className)) removedClassNames.push(className)
    }
    if (removedClassNames.length) this.deleteClassRules(...removedClassNames)
    return removedClassNames.length
  }

  private cleanupRetainedClassRules(force = false) {
    const removedCount = this.removeRetainedClassRules(this.getRetainedClassRuleCleanupCandidates(force))
    if (this.retainedClassNames.size && (force
      || this.retainedClassNames.size > RETAINED_CLASS_RULE_SOFT_TARGET
      || this.exceedsRetainedClassRuleHardLimits())) this.scheduleRetainedClassRuleCleanup()
    return removedCount
  }

  flushRetainedClassRules() {
    this.cancelRetainedClassRuleCleanup()
    const removedCount = this.cleanupRetainedClassRules(true)
    if (this.retainedClassNames.size) this.scheduleRetainedClassRuleCleanup()
    return removedCount
  }

  private flushPendingRemovedClassNames() {
    const classNames = [...this.pendingRemovedClassNames]
      .filter((className) => !this.classCounts.has(className))
    this.pendingRemovedClassNames.clear()
    if (classNames.length) this.retainRemovedClassRules(classNames)
  }

  private flushPendingAddedClassNames() {
    const classNames = [...this.pendingAddedClassNames]
      .filter((className) => this.classCounts.has(className))
    this.pendingAddedClassNames.clear()
    if (classNames.length) this.ensureClassRules(...classNames)
  }

  private handleMutationRecords(records: MutationRecord[]) {
    const deltaCounts = this.classTracker.collectMutations(records)
    const warmClassNames: string[] = []
    const queuedClassNames: string[] = []
    const removedClassNames: string[] = []
    for (const [className, change] of deltaCounts) {
      const current = this.classCounts.get(className) || 0
      const next = current + change
      if (next > 0) {
        this.classCounts.set(className, next)
        if (current === 0) {
          if (this.classUtilities.has(className) || this.retainedClassNames.has(className)) {
            warmClassNames.push(className)
          } else {
            queuedClassNames.push(className)
          }
        }
      } else {
        this.classCounts.delete(className)
        removedClassNames.push(className)
      }
    }
    if (warmClassNames.length) this.ensureClassRules(...warmClassNames)
    if (queuedClassNames.length) this.queueAddedClassNames(queuedClassNames)
    if (removedClassNames.length) {
      this.cancelPendingAddedClassNames(removedClassNames)
      this.queueRemovedClassNames(removedClassNames)
    }
    if (process.env.NODE_ENV === 'development') debugRuntimeMutation(records, deltaCounts, this)
  }

  ensureClassRules(...classNames: string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    this.cancelRetainedClassNames(classNames)
    const transition = this.backendEngine.ensureClassRules(classNames)
    this.applyTransition(transition)
    for (const className of classNames) {
      const inspection = this.backendEngine.inspect(className)
      if (!inspection.valid) {
        this.classUtilities.delete(className)
        continue
      }
      const rules = inspection.rules
        .map((ir) => this.getUtilityLayerByName(ir.layer).rules
          .find((rule): rule is HydratedGeneratedRule =>
            rule instanceof HydratedGeneratedRule && rule.key === ir.key
          ))
        .filter((rule): rule is HydratedGeneratedRule => Boolean(rule))
      if (rules.length) this.classUtilities.set(className, rules)
    }
    return transition
  }

  deleteClassRules(...classNames: string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    this.cancelRetainedClassNames(classNames)
    const transition = this.backendEngine.deleteClassRules(classNames)
    this.applyTransition(transition)
    for (const className of classNames) this.classUtilities.delete(className)
    return transition
  }

  private startMutationObserver() {
    this.observer = new MutationObserver((records) => this.handleMutationRecords(records))
    this.observer.observe(this.root, {
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })
  }

  observe(): this {
    if (this.observing) return this
    this.detectRuntimeStyle()
    const connectedNames = this.collectConnectedClasses()
    if (this.progressive) this.hydrateRuntimeStyle(connectedNames)
    else this.renderRuntimeStyle(connectedNames)
    this.startMutationObserver()
    if (!this.progressive) this.host.removeAttribute('hidden')
    this.observing = true
    if (process.env.NODE_ENV === 'development') debugRuntimeObserved(this)
    return this
  }

  disconnect() {
    this.clearPendingAddedClassNames()
    this.clearPendingRemovedClassNames()
    this.clearRetainedClassRules()
    if (!this.observing) return this
    this.observer?.disconnect()
    this.observer = undefined
    this.observing = false
    const activeClassNames = [...this.classUtilities.keys()]
    if (activeClassNames.length) this.backendEngine.deleteClassRules(activeClassNames)
    this.classCounts.clear()
    this.classTracker.reset()
    this.resetHostRuleState()
    if (!this.progressive) {
      this.style?.remove()
      this.style = null
    }
    if (process.env.NODE_ENV === 'development') debugRuntimeDisconnected(this)
    return this
  }

  refresh(manifest: MasterCSSManifest = this.manifest) {
    this.clearPendingAddedClassNames()
    this.clearPendingRemovedClassNames()
    this.clearRetainedClassRules()
    const transition = this.backendEngine.refresh(manifest)
    this.manifest = manifest
    this.loadManifestHostData(manifest)
    this.classUtilities.clear()
    this.applyTransition(transition)
    for (const className of this.classCounts.keys()) {
      const inspection = this.backendEngine.inspect(className)
      const rules = inspection.rules
        .map((ir) => this.getUtilityLayerByName(ir.layer).rules
          .find((rule): rule is HydratedGeneratedRule =>
            rule instanceof HydratedGeneratedRule && rule.key === ir.key
          ))
        .filter((rule): rule is HydratedGeneratedRule => Boolean(rule))
      if (rules.length) this.classUtilities.set(className, rules)
    }
    if (process.env.NODE_ENV === 'development') debugRuntimeRefreshed(this, manifest)
    return this
  }

  destroy() {
    this.disconnect()
    this.backendEngine.dispose()
    this.unregister()
    if (process.env.NODE_ENV === 'development') debugRuntimeDestroyed(this)
    return this
  }
}

registerGlobal(CSSRuntime)
