import {
  createEngine,
  type MasterCSSEngine,
  type MasterCSSEngineTransition
} from '@master/css'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import {
  MasterCSSError,
} from '@master/css-schema'
import {
  type MasterCSSManifest,
  type MasterCSSManifestUtilityLayerName,
} from '@master/css-schema/manifest'
import {
  type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import RuntimeClassTracker from './class-tracker'
import {
  debugRuntimeCreated,
  debugRuntimeDestroyed,
  debugRuntimeDisconnected,
  debugRuntimeHydrated,
  debugRuntimeObserved,
  debugRuntimeRefreshed
} from './debuggers'
import HydratedGeneratedRule from './generated-rule'
import RuntimeLayer from './layer'
import registerGlobal from './register-global'
import RuntimeHost, { LAYER_ORDER, getGeneratedRuleNodeTexts, isLayerBlockRule } from './host'
import { applyRuntimeMutationDelta } from './mutation'
import {
  findElementById,
  getRootHost,
  isDocumentRoot,
  resolveHydrationManifest
} from './hydration'

const MASTER_CSS_RUNTIME_STYLE_SELECTOR = `style#${MASTER_CSS_RUNTIME_STYLE_ID}`

import {
  RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE,
  RETAINED_CLASS_RULE_HARD_LIMIT,
  RETAINED_CLASS_RULE_HARD_RAW_BYTES,
  RETAINED_CLASS_RULE_IDLE_TIMEOUT_MS,
  RETAINED_CLASS_RULE_MIN_AGE_MS,
  RETAINED_CLASS_RULE_SOFT_TARGET,
  type RetainedClassRule,
  type RuntimeCleanupWindow
} from './retention-config'
import {
  MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS,
  toStartupDiagnostic
} from './startup'
import type {
  MasterCSSRuntimeClassSnapshot,
  MasterCSSRuntimeFacade,
  MasterCSSRuntimeLayerSnapshot,
  MasterCSSRuntimeSnapshot,
  MasterCSSRuntimeStartOptions
} from './types'
import type { HydrateResult } from './types/hydrate-result'
export type * from './types'
export { MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS } from './startup'

interface PendingRuntimeStart {
  readonly promise: Promise<MasterCSSRuntime>
  readonly emittedGlobals: MasterCSSEmittedGlobals[]
  hydrationManifest?: MasterCSSHydrationManifest
}


export class MasterCSSRuntime extends RuntimeHost implements Disposable {
  static #instances = new WeakMap<Document | ShadowRoot, MasterCSSRuntime>()
  static #starts = new WeakMap<Document | ShadowRoot, PendingRuntimeStart>()

  private readonly classCounts = new Map<string, number>()
  private readonly retainedClassNames = new Set<string>()
  private observer?: MutationObserver
  private observing = false
  private disposed = false
  private globalFacade?: MasterCSSRuntimeFacade

  private readonly classTracker = new RuntimeClassTracker()
  private readonly pendingAddedClassNames = new Set<string>()
  private readonly pendingRemovedClassNames = new Set<string>()
  private readonly retainedClassRules = new Map<string, RetainedClassRule>()
  private pendingAdditionFrame: number | undefined
  private pendingRemovalFrame: number | undefined
  private pendingRemovalFlushFrame: number | undefined
  private retainedCleanupIdleHandle: number | undefined
  private retainedCleanupTimeoutHandle: ReturnType<typeof globalThis.setTimeout> | undefined

  private constructor(
    root: Document | ShadowRoot,
    manifest: MasterCSSManifest,
    emittedGlobals: MasterCSSEmittedGlobals | undefined,
    hydrationManifest: MasterCSSHydrationManifest | undefined,
    bindingEngine: MasterCSSEngine
  ) {
    super(root, manifest, emittedGlobals, hydrationManifest, bindingEngine)
  }

  get binding(): MasterCSSEngine['binding'] {
    return this.bindingEngine.binding
  }

  static async start(options: MasterCSSRuntimeStartOptions): Promise<MasterCSSRuntime> {
    const root = options.root || document
    const current = MasterCSSRuntime.#instances.get(root)
    if (current) {
      current.registerEmittedGlobals(options.emittedGlobals)
      if (options.hydrationManifest !== undefined) current.setHydrationManifest(options.hydrationManifest)
      return current
    }
    const pending = MasterCSSRuntime.#starts.get(root)
    if (pending) {
      if (options.emittedGlobals) pending.emittedGlobals.push(options.emittedGlobals)
      if (options.hydrationManifest !== undefined) {
        pending.hydrationManifest = options.hydrationManifest
      }
      return await pending.promise
    }

    let pendingStart: PendingRuntimeStart
    const startup = MasterCSSRuntime.startNew(root, options)
      .then((runtime) => {
        try {
          for (const emittedGlobals of pendingStart.emittedGlobals) {
            runtime.registerEmittedGlobals(emittedGlobals)
          }
          if (pendingStart.hydrationManifest !== undefined) {
            runtime.setHydrationManifest(pendingStart.hydrationManifest)
          }
          return runtime
        } catch (error) {
          runtime.dispose()
          throw error
        }
      })
      .finally(() => MasterCSSRuntime.#starts.delete(root))
    pendingStart = {
      promise: startup,
      emittedGlobals: []
    }
    MasterCSSRuntime.#starts.set(root, pendingStart)
    return await startup
  }

  private static async startNew(root: Document | ShadowRoot, options: MasterCSSRuntimeStartOptions) {
    const {
      binding = 'auto',
      startupTimeoutMs = MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS,
      onDiagnostic
    } = options
    const ownerWindow = (isDocumentRoot(root) ? root : root.ownerDocument).defaultView || globalThis
    let abandoned = false
    let ownedEngine: MasterCSSEngine | undefined
    let startupRuntime: MasterCSSRuntime | undefined
    let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | undefined
    const enginePromise = createEngine({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals,
      binding
    }).then((engine) => {
      if (abandoned) {
        engine.dispose()
      } else {
        ownedEngine = engine
      }
      return engine
    })
    const hydrationPromise = resolveHydrationManifest(root, options.hydrationManifest)
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = ownerWindow.setTimeout(() => reject(new MasterCSSError({
        code: 'RUNTIME_STARTUP_TIMEOUT',
        domain: 'runtime',
        message: `Master CSS runtime did not start within ${startupTimeoutMs}ms.`
      })), startupTimeoutMs)
    })

    try {
      const [engine, hydrationManifest] = await Promise.race([
        Promise.all([enginePromise, hydrationPromise]),
        timeoutPromise
      ])
      if (timeoutHandle !== undefined) ownerWindow.clearTimeout(timeoutHandle)
      startupRuntime = new MasterCSSRuntime(
        root,
        options.manifest,
        options.emittedGlobals,
        hydrationManifest,
        engine
      )
      return startupRuntime.register()
    } catch (error) {
      abandoned = true
      ;(startupRuntime || ownedEngine)?.dispose()
      if (timeoutHandle !== undefined) ownerWindow.clearTimeout(timeoutHandle)
      getRootHost(root).removeAttribute('hidden')
      onDiagnostic?.(toStartupDiagnostic(error))
      throw error
    }
  }


  private register(): this {
    const registered = MasterCSSRuntime.#instances.get(this.root) === this
    MasterCSSRuntime.#instances.set(this.root, this)
    if (isDocumentRoot(this.root)) {
      this.root.defaultView!.globalThis.masterCSSRuntime = this.getGlobalFacade()
    }
    if (!registered && process.env.NODE_ENV === 'development') debugRuntimeCreated(this)
    return this
  }

  private unregister(): this {
    MasterCSSRuntime.#instances.delete(this.root)
    if (
      isDocumentRoot(this.root)
      && this.root.defaultView!.globalThis.masterCSSRuntime === this.globalFacade
    ) {
      this.root.defaultView!.globalThis.masterCSSRuntime = undefined
    }
    return this
  }

  private getGlobalFacade(): MasterCSSRuntimeFacade {
    if (this.globalFacade) return this.globalFacade
    let facade: MasterCSSRuntimeFacade
    const getBinding = () => this.binding
    facade = Object.freeze({
      get binding() {
        return getBinding()
      },
      observe: () => {
        this.observe()
        return facade
      },
      disconnect: () => {
        this.disconnect()
        return facade
      },
      refresh: (manifest?: MasterCSSManifest) => {
        this.refresh(manifest)
        return facade
      },
      ensureClassRules: (classNames: readonly string[]) =>
        this.ensureClassRules(classNames),
      deleteClassRules: (classNames: readonly string[]) =>
        this.deleteClassRules(classNames),
      snapshot: () => this.snapshot(),
      dispose: () => this.dispose(),
      [Symbol.dispose]: () => this.dispose()
    })
    this.globalFacade = facade
    return facade
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
    this.adoptSnapshot(this.bindingEngine.snapshot())
    this.ensureClassRules([...connectedNames])
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
    if (ensuredClassNames.length) this.bindingEngine.deleteClassRules(ensuredClassNames)
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

  private getHydrationClassNames(manifest: MasterCSSHydrationManifest) {
    const resourceOrder = new Map(manifest.resourceOrder.map((name, index) => [name, index]))
    const classResources = new Map<string, string[]>()
    for (const rule of manifest.rules) {
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

  private hydrate(nativeLayerRules: CSSRuleList): HydrateResult | undefined {
    this.hydrationFailureReason = undefined
    const manifest = this.hydrationManifest
    if (manifest?.version !== 1 || !Array.isArray(manifest.rules)) {
      return this.failHydration('Missing or invalid hydration manifest.')
    }
    if (!manifest.rules.length) {
      return this.failHydration(`Hydration manifest has no generated rules for ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
    }
    const classNames = this.getHydrationClassNames(manifest)
    this.bindingEngine.ensureClassRules(classNames)
    const snapshot = this.bindingEngine.snapshot()
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
    if (missing.length) this.ensureClassRules(missing)
  }

  private renderRuntimeStyle(connectedNames: Set<string>) {
    this.createRuntimeStyle()
    this.adoptSnapshot(this.bindingEngine.snapshot())
    this.ensureClassRules([...connectedNames])
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
    if (removedClassNames.length) this.deleteClassRules(removedClassNames)
    return removedClassNames.length
  }

  private cleanupRetainedClassRules(force = false) {
    const removedCount = this.removeRetainedClassRules(this.getRetainedClassRuleCleanupCandidates(force))
    if (this.retainedClassNames.size && (force
      || this.retainedClassNames.size > RETAINED_CLASS_RULE_SOFT_TARGET
      || this.exceedsRetainedClassRuleHardLimits())) this.scheduleRetainedClassRuleCleanup()
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
    if (classNames.length) this.ensureClassRules(classNames)
  }

  private handleMutationRecords(records: MutationRecord[]) {
    const deltaCounts = this.classTracker.collectMutations(records, this.root)
    applyRuntimeMutationDelta(records, deltaCounts, {
      classCounts: this.classCounts,
      isWarm: (className) => this.classUtilities.has(className) || this.retainedClassNames.has(className),
      ensure: (classNames) => this.ensureClassRules(classNames),
      queueAdded: (classNames) => this.queueAddedClassNames(classNames),
      queueRemoved: (classNames) => this.queueRemovedClassNames(classNames),
      cancelAdded: (classNames) => this.cancelPendingAddedClassNames(classNames),
      debug: () => [this.root, this.host, this.snapshot()]
    })
  }

  ensureClassRules(classNames: readonly string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    this.cancelRetainedClassNames(classNames)
    const transition = this.bindingEngine.ensureClassRules(classNames)
    this.applyTransition(transition)
    for (const className of classNames) {
      const inspection = this.bindingEngine.inspect(className)
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

  deleteClassRules(classNames: readonly string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    this.cancelRetainedClassNames(classNames)
    const transition = this.bindingEngine.deleteClassRules(classNames)
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
    if (activeClassNames.length) this.bindingEngine.deleteClassRules(activeClassNames)
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
    const transition = this.bindingEngine.refresh(manifest)
    this.manifest = manifest
    this.loadManifestHostData(manifest)
    this.classUtilities.clear()
    this.applyTransition(transition)
    for (const className of this.classCounts.keys()) {
      const inspection = this.bindingEngine.inspect(className)
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

  snapshot(): MasterCSSRuntimeSnapshot {
    const usageCounts = Object.freeze(Object.fromEntries(this.classCounts))
    const classNames = new Set([
      ...this.classUtilities.keys(),
      ...this.classCounts.keys(),
      ...this.retainedClassNames
    ])
    const classRules: Record<string, MasterCSSRuntimeClassSnapshot> = Object.create(null)
    for (const className of [...classNames].sort()) {
      const rules = (this.classUtilities.get(className) || []).map((rule) => Object.freeze({
        key: rule.key,
        layer: rule.layer.name as MasterCSSManifestUtilityLayerName,
        text: rule.text
      }))
      classRules[className] = Object.freeze({
        usageCount: this.classCounts.get(className) || 0,
        retained: this.retainedClassNames.has(className),
        rules: Object.freeze(rules)
      })
    }
    const layers: MasterCSSRuntimeLayerSnapshot[] = [
      ...LAYER_ORDER.map((name) => {
        const layer = this.getLayerByName(name)!
        return Object.freeze({
          name,
          cssText: layer.text,
          ruleCount: layer.rules.length
        })
      }),
      Object.freeze({
        name: 'keyframes' as const,
        cssText: this.animationsNonLayer.rules.map(({ text }) => text).join(''),
        ruleCount: this.animationsNonLayer.rules.length
      })
    ]
    return Object.freeze({
      binding: this.binding,
      cssText: this.bindingEngine.snapshot().text,
      observing: this.observing,
      classRules: Object.freeze(classRules),
      usageCounts,
      layers: Object.freeze(layers),
      hydration: Object.freeze({
        state: this.progressive
          ? 'progressive' as const
          : this.style
            ? 'runtime' as const
            : 'none' as const,
        manifestLoaded: this.hydrationManifest !== undefined,
        ...(this.hydrationFailureReason
          ? { failureReason: this.hydrationFailureReason }
          : {})
      })
    })
  }

  dispose() {
    if (this.disposed) return
    this.disconnect()
    this.bindingEngine.dispose()
    this.unregister()
    this.disposed = true
    if (process.env.NODE_ENV === 'development') debugRuntimeDestroyed(this)
  }

  [Symbol.dispose]() {
    this.dispose()
  }
}

registerGlobal(MasterCSSRuntime)
