import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type {
  MasterCSSGeneratedRuleIR,
  MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEngineSnapshot } from './engine/backend'

export interface MasterCSSNativeDeclaration {
  readonly className: string
  readonly property: string
  readonly value: string
}

export type MasterCSSNativeDeclarationSupport = (
  declaration: MasterCSSNativeDeclaration
) => boolean

export interface MasterCSSRenderSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
  readonly supportsNativeDeclaration?: MasterCSSNativeDeclarationSupport
}

export interface MasterCSSRenderSnapshot {
  readonly classNames: readonly string[]
  readonly invalidClassNames: readonly string[]
  readonly cssText: string
  readonly rules: readonly MasterCSSGeneratedRuleIR[]
  readonly classRules: Readonly<Record<string, readonly MasterCSSGeneratedRuleIR[]>>
  readonly engine: MasterCSSEngineSnapshot
  readonly emittedGlobals: MasterCSSEmittedGlobals
  readonly hydrationManifest: Readonly<Omit<MasterCSSHydrationManifest, 'rules' | 'resourceOrder'>> & {
    readonly rules: readonly MasterCSSGeneratedRuleIR[]
    readonly resourceOrder: readonly string[]
  }
}

interface BackendRenderResult {
  classes: string[]
  snapshot: MasterCSSEngineSnapshot
  hydrationManifest: MasterCSSHydrationManifest
}

export interface BackendRenderSession {
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclaration[]
  ensureClasses(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): MasterCSSEmittedGlobals
  snapshot(): BackendRenderResult
  snapshotForClasses(classNames: readonly string[]): BackendRenderResult
  dispose(): void
}

function freezeArray<T>(values: readonly T[]) {
  return Object.freeze([...values])
}

function toSnapshot(
  rendered: BackendRenderResult,
  emittedGlobals: MasterCSSEmittedGlobals
): MasterCSSRenderSnapshot {
  const classRules: Record<string, MasterCSSGeneratedRuleIR[]> = Object.create(null)
  for (const rule of rendered.snapshot.rules) {
    ;(classRules[rule.className] ||= []).push(rule)
  }
  for (const rules of Object.values(classRules)) Object.freeze(rules)
  const classNames = freezeArray(rendered.classes)
  return Object.freeze({
    classNames,
    invalidClassNames: freezeArray(
      classNames.filter((className) => !Object.hasOwn(classRules, className))
    ),
    cssText: rendered.snapshot.text,
    rules: freezeArray(rendered.snapshot.rules),
    classRules: Object.freeze(classRules),
    engine: Object.freeze(rendered.snapshot),
    emittedGlobals: Object.freeze({ ...emittedGlobals }),
    hydrationManifest: Object.freeze({
      ...rendered.hydrationManifest,
      rules: freezeArray(rendered.hydrationManifest.rules),
      resourceOrder: freezeArray(rendered.hydrationManifest.resourceOrder)
    })
  })
}

let bindRenderSession: (
  session: BackendRenderSession,
  supportsNativeDeclaration?: MasterCSSNativeDeclarationSupport
) => MasterCSSRenderSession

export class MasterCSSRenderSession implements Disposable {
  #session!: BackendRenderSession
  #supportsNativeDeclaration: MasterCSSNativeDeclarationSupport = () => false
  #disposed = false

  private constructor() { }

  ensureClassRules(classNames: readonly string[]) {
    this.assertActive()
    const classes = [...classNames]
    const candidates = this.#session.nativeDeclarationCandidates(classes)
    const support = candidates.map((candidate) => this.#supportsNativeDeclaration(candidate))
    this.#session.ensureClasses(classes, support.length ? support : undefined)
    return this.snapshot()
  }

  ensureStylesheetResources(nativeCSS: string) {
    this.assertActive()
    this.#session.ensureStylesheetResources(nativeCSS)
    return this
  }

  snapshot() {
    this.assertActive()
    return toSnapshot(
      this.#session.snapshot(),
      this.#session.emittedGlobals()
    )
  }

  snapshotForClassNames(classNames: readonly string[]) {
    this.assertActive()
    return toSnapshot(
      this.#session.snapshotForClasses([...classNames]),
      this.#session.emittedGlobals()
    )
  }

  dispose() {
    if (this.#disposed) return
    this.#session.dispose()
    this.#disposed = true
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private assertActive() {
    if (this.#disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'engine',
        message: 'The Master CSS render session has been disposed.'
      })
    }
  }

  static {
    bindRenderSession = (session, supportsNativeDeclaration) => {
      const renderer = new MasterCSSRenderSession()
      renderer.#session = session
      renderer.#supportsNativeDeclaration = supportsNativeDeclaration ?? (() => false)
      return renderer
    }
  }
}

/** @internal */
export function bindRenderSessionInternal(
  session: BackendRenderSession,
  supportsNativeDeclaration?: MasterCSSNativeDeclarationSupport
) {
  return bindRenderSession(session, supportsNativeDeclaration)
}
