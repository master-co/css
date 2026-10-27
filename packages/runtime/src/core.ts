import type {
  MasterCSSEngine,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition
} from '@master/css'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import {
  MasterCSSError,
} from '@master/css-schema'
import type { MasterCSSManifestUtilityLayerName } from '@master/css-schema/manifest'
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
import { applyDeferredMutationDelta, applyRuntimeMutationDelta } from './mutation'
import {
  findElementById,
  getRenderedClassNames,
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
  createStartupTimeout,
  toStartupDiagnostic
} from './startup'
import type {
  MasterCSSRuntimeClassSnapshot,
  MasterCSSRuntimeEngineState,
  MasterCSSRuntimeFacade,
  MasterCSSRuntimeLayerSnapshot,
  MasterCSSRuntimeProgram,
  MasterCSSRuntimeProgramLoader,
  MasterCSSRuntimeRuleSnapshot,
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

interface LoadedEngine {
  readonly engine: MasterCSSEngine
  readonly program: Uint8Array
}

function programBytes(program: MasterCSSRuntimeProgram) {
  return ArrayBuffer.isView(program)
    ? new Uint8Array(program.buffer, program.byteOffset, program.byteLength)
    : new Uint8Array(program)
}

async function resolveProgram(program: MasterCSSRuntimeProgram | MasterCSSRuntimeProgramLoader) {
  return programBytes(typeof program === 'function' ? await program() : program)
}

/** `@master/css` stays out of the entry chunk, so deferred pages never download it. */
async function loadEngine(
  program: Promise<Uint8Array>,
  emittedGlobals: MasterCSSEmittedGlobals | undefined,
  binding: NonNullable<MasterCSSRuntimeStartOptions['binding']>
): Promise<LoadedEngine> {
  // Destructured directly so bundlers can drop the rest of @master/css.
  const { createEngine } = await import('@master/css')
  const resolvedProgram = await program
  return {
    engine: await createEngine({ program: resolvedProgram, emittedGlobals, binding }),
    program: resolvedProgram
  }
}

function runtimeDisposedError() {
  return new MasterCSSError({
    code: 'RUNTIME_DISPOSED',
    domain: 'runtime',
    message: 'The Master CSS runtime has been disposed.'
  })
}

export class MasterCSSRuntime extends RuntimeHost implements Disposable {
  static #instances = new WeakMap<Document | ShadowRoot, MasterCSSRuntime>()
  static #starts = new WeakMap<Document | ShadowRoot, PendingRuntimeStart>()

  private readonly classCounts = new Map<string, number>()
  private readonly retainedClassNames = new Set<string>()
  private observer?: MutationObserver
  private observing = false
  private readonly handleStylesheetLoad = () => this.reconcileKeyframeRules()
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

  private engineState: MasterCSSRuntimeEngineState
  private engineStart?: Promise<this>
  private programSource: MasterCSSRuntimeProgram | MasterCSSRuntimeProgramLoader
  private programRequest?: Promise<Uint8Array>
  /** The program the engine executes; refresh() without one re-executes it. */
  private program?: Uint8Array
  /** Engine calls made while it loads, replayed in order once it is installed or fails. */
  private readonly pendingEngineCalls: (() => void)[] = []
  private renderedClassNames: Set<string>
  private readonly engineBinding: NonNullable<MasterCSSRuntimeStartOptions['binding']>
  private readonly startupTimeoutMs: number
  private readonly onDiagnostic: MasterCSSRuntimeStartOptions['onDiagnostic']

  private constructor(
    root: Document | ShadowRoot,
    options: MasterCSSRuntimeStartOptions,
    hydrationManifest: MasterCSSHydrationManifest | undefined,
    loaded?: LoadedEngine
  ) {
    super(root, options.emittedGlobals, hydrationManifest, options.stylesheets, options.stylesheetDelivery)
    this.programSource = options.program
    this.renderedClassNames = getRenderedClassNames(hydrationManifest)
    this.engineBinding = options.binding || 'auto'
    this.startupTimeoutMs = options.startupTimeoutMs ?? MASTER_CSS_RUNTIME_STARTUP_TIMEOUT_MS
    this.onDiagnostic = options.onDiagnostic
    if (loaded) {
      this.bindingEngine = loaded.engine
      this.program = loaded.program
      this.keyframeDefinitions = loaded.engine.keyframeDefinitions()
      this.engineState = 'ready'
    } else {
      this.engineState = 'deferred'
      if (options.enginePrefetch === 'idle') this.startEngineWhenIdle()
    }
  }

  get binding(): MasterCSSEngine['binding'] | undefined {
    return this.bindingEngine?.binding
  }

  static async start(options: MasterCSSRuntimeStartOptions): Promise<MasterCSSRuntime> {
    const root = options.root || document
    const current = MasterCSSRuntime.#instances.get(root)
    if (current) {
      current.registerEmittedGlobals(options.emittedGlobals)
      if (options.hydrationManifest !== undefined) current.setHydrationManifest(options.hydrationManifest)
      current.retryEngine()
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
    const timeout = createStartupTimeout(ownerWindow, startupTimeoutMs, 'runtime')
    let abandoned = false
    let ownedEngine: MasterCSSEngine | undefined
    let startupRuntime: MasterCSSRuntime | undefined
    const startEngine = () => loadEngine(resolveProgram(options.program), options.emittedGlobals, binding)
      .then((loaded) => {
        if (abandoned) {
          loaded.engine.dispose()
        } else {
          ownedEngine = loaded.engine
        }
        return loaded
      })
    // Only a pre-rendered stylesheet can defer the engine; its hydration manifest decides.
    const deferrable = options.engine !== 'eager' && Boolean(findElementById(root, MASTER_CSS_RUNTIME_STYLE_ID))
    const enginePromise = deferrable ? undefined : startEngine()
    const hydrationPromise = resolveHydrationManifest(root, options.hydrationManifest)

    try {
      let loaded: LoadedEngine | undefined
      let hydrationManifest: MasterCSSHydrationManifest | undefined
      if (enginePromise) {
        [loaded, hydrationManifest] = await timeout.race(Promise.all([enginePromise, hydrationPromise]))
      } else {
        hydrationManifest = await timeout.race(hydrationPromise)
        if (!hydrationManifest?.classNames.length) loaded = await timeout.race(startEngine())
      }
      timeout.clear()
      startupRuntime = new MasterCSSRuntime(root, options, hydrationManifest, loaded)
      return startupRuntime.register()
    } catch (error) {
      abandoned = true
      ;(startupRuntime || ownedEngine)?.dispose()
      timeout.clear()
      getRootHost(root).removeAttribute('hidden')
      onDiagnostic?.(toStartupDiagnostic(error))
      throw error
    }
  }

  /** Starts the engine of a deferred progressive page, resolving once it executes rules. */
  ready(): Promise<this> {
    if (this.disposed) return Promise.reject(runtimeDisposedError())
    return this.engineState === 'ready' ? Promise.resolve(this) : this.startEngine()
  }

  private startEngine(): Promise<this> {
    this.engineStart ??= this.loadDeferredEngine()
    return this.engineStart
  }

  private async loadDeferredEngine(): Promise<this> {
    this.engineState = 'loading'
    const timeout = createStartupTimeout(this.getAnimationFrameWindow(), this.startupTimeoutMs, 'engine')
    const loading = loadEngine(this.loadProgram(), this.emittedGlobals, this.engineBinding)
    try {
      const { engine, program } = await timeout.race(loading)
      if (this.disposed) throw runtimeDisposedError()
      this.installEngine(engine, program)
      return this
    } catch (error) {
      if (!this.disposed) {
        // Pre-rendered CSS stays valid. Only refresh() or start() retries.
        this.engineState = 'failed'
        this.programRequest = undefined
        this.host.removeAttribute('hidden')
        this.onDiagnostic?.(toStartupDiagnostic(error))
        this.replayPendingEngineCalls()
      }
      // An engine that loads after a timeout or disposal is not this runtime's.
      void loading.then(({ engine }) => {
        if (this.engineState === 'ready' && this.bindingEngine === engine) return
        if (this.bindingEngine === engine) this.bindingEngine = undefined
        engine.dispose()
      }, () => {})
      throw error
    } finally {
      timeout.clear()
    }
  }

  private loadProgram() {
    this.programRequest ??= resolveProgram(this.programSource)
    return this.programRequest
  }

  private installEngine(engine: MasterCSSEngine, program: Uint8Array) {
    this.bindingEngine = engine
    this.program = program
    this.keyframeDefinitions = engine.keyframeDefinitions()
    this.engineState = 'ready'
    if (this.observing) {
      this.adoptConnectedClasses(new Set(this.classCounts.keys()))
      this.reconcileKeyframeRules()
    }
    this.replayPendingEngineCalls()
  }

  private replayPendingEngineCalls() {
    for (const call of this.pendingEngineCalls.splice(0)) call()
  }

  private startEngineWhenIdle() {
    const view = this.getCleanupWindow()
    const start = () => this.requestEngine()
    if (view.requestIdleCallback) view.requestIdleCallback(start)
    else view.setTimeout(start, 0)
  }

  /** Starts a deferred engine for a class pre-rendered CSS lacks; a failed one waits for a retry. */
  private requestEngine() {
    if (this.engineState === 'deferred' && !this.disposed) void this.startEngine().catch(() => {})
  }

  private retryEngine() {
    if (this.engineState !== 'failed') return
    this.engineStart = undefined
    this.engineState = 'deferred'
    this.requestEngine()
  }

  private requireEngine() {
    if (this.engineState === 'ready') return this.engine
    this.requestEngine()
    throw new MasterCSSError({
      code: 'RUNTIME_ENGINE_NOT_READY',
      domain: 'runtime',
      message: 'The Master CSS engine has not started. Await runtime.ready() before changing class rules.'
    })
  }

  protected override registerEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals) {
    if (emittedGlobals && this.engineState === 'loading') {
      this.pendingEngineCalls.push(() => super.registerEmittedGlobals(emittedGlobals))
    } else {
      super.registerEmittedGlobals(emittedGlobals)
    }
  }

  protected override setHydrationManifest(hydrationManifest?: MasterCSSHydrationManifest): this {
    this.renderedClassNames = getRenderedClassNames(hydrationManifest)
    return super.setHydrationManifest(hydrationManifest)
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
      ready: async () => {
        await this.ready()
        return facade
      },
      observe: () => {
        this.observe()
        return facade
      },
      disconnect: () => {
        this.disconnect()
        return facade
      },
      refresh: (program?: MasterCSSRuntimeProgram, emittedGlobals?: MasterCSSEmittedGlobals) => {
        this.refresh(program, emittedGlobals)
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
    this.adoptSnapshot(this.engine.snapshot())
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
    if (ensuredClassNames.length) this.engine.deleteClassRules(ensuredClassNames)
    this.resetHostRuleState()
    return undefined
  }

  private matchesEngineSnapshotText(snapshot: MasterCSSEngineSnapshot) {
    const sheet = this.getStyleSheet()
    if (!sheet) return false
    const expectedStyle = this.getOwnerDocument().createElement('style')
    expectedStyle.media = 'not all'
    expectedStyle.textContent = snapshot.text
    this.container.append(expectedStyle)
    try {
      const expectedRules = expectedStyle.sheet?.cssRules
      if (!expectedRules || !this.rebaseSnapshotResources(expectedStyle.sheet!, snapshot)) return false
      const checkedLayers = new Set<string>()
      for (const layer of expectedRules) {
        if (!isLayerBlockRule(layer) || layer.name === 'theme' || checkedLayers.has(layer.name)
          || !snapshot.rules.some(rule => rule.layer === layer.name)) continue
        checkedLayers.add(layer.name)
        const nodeCount = snapshot.rules
          .filter(rule => rule.layer === layer.name)
          .reduce((count, rule) => count + (rule.nodes?.length || 1), 0)
        if (layer.cssRules.length !== nodeCount) return false
      }
      const actualRules = [...sheet.cssRules]
      return actualRules.length === expectedRules.length
        && actualRules.every((rule, index) => rule.cssText === expectedRules[index].cssText)
    } finally {
      expectedStyle.remove()
    }
  }

  private hydrate(nativeLayerRules: CSSRuleList): HydrateResult | undefined {
    this.hydrationFailureReason = undefined
    const manifest = this.hydrationManifest
    if (manifest?.version !== 5 || !Array.isArray(manifest.classNames)) {
      return this.failHydration('Missing or invalid hydration manifest.')
    }
    if (!manifest.classNames.length) {
      return this.failHydration(`Hydration manifest has no rendered classes for ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
    }
    // Replaying the server's class order reproduces its resource order; the resource
    // and CSSOM comparisons below then prove the engine renders the same stylesheet.
    const classNames = [...manifest.classNames]
    this.engine.ensureClassRules(classNames)
    let snapshot = this.engine.snapshot()
    // The server knows which stylesheets this page links; this bundle's emitted
    // globals may describe others. Resources follow the server's.
    if (this.registerMissingEmittedGlobals(manifest.emittedGlobals)) snapshot = this.engine.snapshot()
    const resourceOrder = {
      variables: snapshot.resources.variables.map(resource => resource.name),
      keyframes: snapshot.resources.keyframes.map(resource => resource.id)
    }
    if (JSON.stringify(resourceOrder) !== JSON.stringify(manifest.resourceOrder)) {
      return this.failHydration('Generated resources do not match the hydration manifest.', classNames)
    }
    if (!this.matchesEngineSnapshotText(snapshot)) {
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
    // Pre-rendered classes gone from the DOM, including removals while the engine
    // was deferred, enter the same retention as later removals.
    this.queueRemovedClassNames(hydratedClassNames)
  }

  private renderRuntimeStyle(connectedNames: Set<string>) {
    this.createRuntimeStyle()
    this.adoptSnapshot(this.engine.snapshot())
    this.ensureClassRules([...connectedNames])
  }

  private adoptConnectedClasses(connectedNames: Set<string>) {
    if (this.progressive) this.hydrateRuntimeStyle(connectedNames)
    else this.renderRuntimeStyle(connectedNames)
    // A failed hydration also rebuilds with runtime CSS.
    if (!this.progressive) this.host.removeAttribute('hidden')
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
    const release: string[] = []
    for (const className of classNames) {
      if (this.classCounts.has(className)) continue
      // Rust's rule IR identifies animation roots. A warm utility cache must
      // not extend the lifetime of its keyframes or their token dependencies.
      if (this.classUtilities.get(className)?.some(({ ir }) => ir.retainAllKeyframes || ir.keyframeNames?.length)) {
        release.push(className)
        continue
      }
      const retainedRule = this.retainedClassRules.get(className) || this.estimateRetainedClassRule(className)
      if (!retainedRule) continue
      this.retainedClassNames.add(className)
      this.retainedClassRules.set(className, retainedRule)
    }
    if (release.length) this.deleteClassRules(release)
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
    if (records.some(record => {
      const target = record.target.nodeType === 3 ? record.target.parentElement : record.target
      if (target?.nodeType === 1 && (target as Element).matches('style') && target !== this.style) return true
      return [...record.addedNodes, ...record.removedNodes].some(node =>
        node.nodeType === 1 && node !== this.style
        && ((node as Element).matches('style,link[rel="stylesheet"]') || (node as Element).querySelector('style,link[rel="stylesheet"]')))
    })) this.reconcileKeyframeRules()
    const deltaCounts = this.classTracker.collectMutations(records, this.root)
    if (this.engineState !== 'ready') {
      const addedClassNames = applyDeferredMutationDelta(deltaCounts, this.classCounts)
      if (addedClassNames.some(className => !this.renderedClassNames.has(className))) this.requestEngine()
      return
    }
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
    const engine = this.requireEngine()
    this.cancelRetainedClassNames(classNames)
    const transition = engine.ensureClassRules(classNames)
    this.applyTransition(transition, classNames)
    return transition
  }

  deleteClassRules(classNames: readonly string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    const engine = this.requireEngine()
    this.cancelRetainedClassNames(classNames)
    const transition = engine.deleteClassRules(classNames)
    this.applyTransition(transition, classNames)
    return transition
  }

  private startMutationObserver() {
    this.observer = new MutationObserver((records) => this.handleMutationRecords(records))
    this.observer.observe(this.root, {
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })
  }

  observe(): this {
    if (this.observing) return this
    this.detectRuntimeStyle()
    const connectedNames = this.collectConnectedClasses()
    if (this.engineState === 'ready') {
      this.adoptConnectedClasses(connectedNames)
    } else if (!this.progressive || [...connectedNames].some(className => !this.renderedClassNames.has(className))) {
      // Pre-rendered CSS styles covered classes; the engine starts for the first one it lacks.
      this.requestEngine()
    }
    this.startMutationObserver()
    this.root.addEventListener('load', this.handleStylesheetLoad, true)
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
    this.root.removeEventListener('load', this.handleStylesheetLoad, true)
    this.observing = false
    const activeClassNames = [...this.classUtilities.keys()]
    if (activeClassNames.length) this.bindingEngine?.deleteClassRules(activeClassNames)
    this.classCounts.clear()
    this.classTracker.reset()
    this.clearKeyframeRules()
    this.resetHostRuleState()
    if (!this.progressive) {
      this.style?.remove()
      this.style = null
    }
    if (process.env.NODE_ENV === 'development') debugRuntimeDisconnected(this)
    return this
  }

  refresh(program?: MasterCSSRuntimeProgram, emittedGlobals?: MasterCSSEmittedGlobals) {
    if (this.engineState === 'loading') {
      this.pendingEngineCalls.push(() => this.refresh(program, emittedGlobals))
      return this
    }
    if (this.engineState !== 'ready') {
      // The engine has not loaded: it starts from the refreshed inputs instead.
      if (program) {
        this.programSource = program
        this.programRequest = undefined
      }
      if (emittedGlobals) this.adoptEmittedGlobals(emittedGlobals)
      this.retryEngine()
      this.requestEngine()
      return this
    }
    const next = program ? programBytes(program) : this.program!
    // HMR drops deferred removals and the warm cache. Release their rules first,
    // or the Rust rebuild replays them as connected classes nothing owns.
    const releasedClassNames = [...new Set([...this.pendingRemovedClassNames, ...this.retainedClassNames])]
      .filter((className) => !this.classCounts.has(className))
    if (releasedClassNames.length) this.deleteClassRules(releasedClassNames)
    const transition = this.engine.refresh(next, emittedGlobals)
    if (emittedGlobals) this.adoptEmittedGlobals(emittedGlobals)
    this.clearPendingAddedClassNames()
    this.clearPendingRemovedClassNames()
    this.clearRetainedClassRules()
    this.program = next
    this.keyframeDefinitions = this.engine.keyframeDefinitions()
    this.clearClassReferences()
    this.applyTransition(transition)
    this.reconcileKeyframeRules()
    this.ensureClassRules([...this.classCounts.keys()])
    if (process.env.NODE_ENV === 'development') debugRuntimeRefreshed(this, next)
    return this
  }

  /** Rules come from the engine; until it starts, classes report usage only. */
  private getClassRuleSnapshots() {
    const ruleSnapshots = new Map<string, MasterCSSRuntimeRuleSnapshot[]>()
    for (const [className, rules] of this.classUtilities) {
      ruleSnapshots.set(className, rules.map((rule) => Object.freeze({
        key: rule.key,
        layer: rule.layer.name as MasterCSSManifestUtilityLayerName,
        text: rule.text
      })))
    }
    return ruleSnapshots
  }

  snapshot(): MasterCSSRuntimeSnapshot {
    const usageCounts = Object.freeze(Object.fromEntries(this.classCounts))
    const ruleSnapshots = this.getClassRuleSnapshots()
    const classNames = new Set([
      ...ruleSnapshots.keys(),
      ...this.classCounts.keys(),
      ...this.retainedClassNames
    ])
    const classRules: Record<string, MasterCSSRuntimeClassSnapshot> = Object.create(null)
    for (const className of [...classNames].sort()) {
      classRules[className] = Object.freeze({
        usageCount: this.classCounts.get(className) || 0,
        retained: this.retainedClassNames.has(className),
        rules: Object.freeze(ruleSnapshots.get(className) || [])
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
      })
    ]
    return Object.freeze({
      binding: this.binding,
      engine: this.engineState,
      cssText: this.engineState === 'ready' ? this.engine.snapshot().text : this.style?.textContent || '',
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
    this.bindingEngine?.dispose()
    this.unregister()
    this.disposeNativeStylesheets()
    this.disposed = true
    if (process.env.NODE_ENV === 'development') debugRuntimeDestroyed(this)
  }

  [Symbol.dispose]() {
    this.dispose()
  }
}

registerGlobal(MasterCSSRuntime)
