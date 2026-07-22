import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSServerRenderIR
} from '@master/css-schema/rust-contract'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'

type RenderSnapshot = (classNames: string[]) => MasterCSSServerRenderIR

export interface ServerCSSEmittedGlobals {
  variables?: Record<string, number>
  animations?: Record<string, number>
}

export class ServerCSS {
  readonly manifest: MasterCSSManifest
  readonly classUtilities = new Map<string, MasterCSSServerRenderIR['snapshot']['rules']>()
  private readonly session
  private readonly classNames: string[] = []
  private readonly classIndex = new Set<string>()
  private readonly renderSnapshot?: RenderSnapshot
  private currentSnapshot?: MasterCSSServerRenderIR
  private disposed = false

  constructor(manifest: MasterCSSManifest, emittedGlobals?: ServerCSSEmittedGlobals)
  constructor(
    manifest: MasterCSSManifest,
    emittedGlobals?: ServerCSSEmittedGlobals,
    renderSnapshot?: RenderSnapshot
  ) {
    this.manifest = manifest
    this.renderSnapshot = renderSnapshot
    this.session = renderSnapshot ? undefined : createNativeRenderSession(manifest, emittedGlobals)
  }

  ensureClassRules(...classNames: string[]) {
    this.assertActive()
    if (this.renderSnapshot) {
      for (const className of classNames) {
        if (className && !this.classIndex.has(className)) {
          this.classIndex.add(className)
          this.classNames.push(className)
        }
      }
      this.currentSnapshot = this.renderSnapshot(this.classNames)
    } else {
      ensureNativeRenderSessionClasses(this.session!, classNames)
      this.currentSnapshot = undefined
    }
    this.syncClassUtilities()
    return this
  }

  snapshot() {
    if (!this.currentSnapshot) {
      this.assertActive()
      this.currentSnapshot = this.renderSnapshot
        ? this.renderSnapshot(this.classNames)
        : JSON.parse(this.session!.snapshot()) as MasterCSSServerRenderIR
    }
    return this.currentSnapshot
  }

  get text() {
    return this.snapshot().snapshot.text
  }

  get hydrationManifest() {
    return this.snapshot().hydrationManifest
  }

  get rules() {
    return this.snapshot().snapshot.rules
  }

  private syncClassUtilities() {
    this.classUtilities.clear()
    for (const rule of this.snapshot().snapshot.rules) {
      const rules = this.classUtilities.get(rule.className)
      if (rules) rules.push(rule)
      else this.classUtilities.set(rule.className, [rule])
    }
  }

  dispose() {
    if (this.disposed) return
    this.session?.dispose()
    this.disposed = true
  }

  private assertActive() {
    if (this.disposed) {
      throw new Error('ServerCSS has been disposed.')
    }
  }
}

export function createNativeRenderSession(
  manifest: MasterCSSManifest,
  emittedGlobals?: ServerCSSEmittedGlobals
) {
  const loaded = loadNativeBinding({ required: true })!
  return new loaded.binding.RenderSession(
    stringifyMasterCSSManifestJSON(manifest),
    emittedGlobals ? JSON.stringify(emittedGlobals) : undefined
  )
}

export function ensureNativeRenderSessionClasses(
  session: ReturnType<typeof createNativeRenderSession>,
  classNames: string[]
) {
  const candidates = JSON.parse(
    session.nativeDeclarationCandidates(classNames)
  ) as MasterCSSNativeDeclarationCandidateIR[]
  const support = candidates.map(cssTreeNativeDeclarationMatcher)
  session.ensureClasses(classNames, support.length ? support : undefined)
}

type InternalServerCSSConstructor = new (
  manifest: MasterCSSManifest,
  emittedGlobals: ServerCSSEmittedGlobals | undefined,
  renderSnapshot: RenderSnapshot
) => ServerCSS

export function createRendererServerCSS(
  manifest: MasterCSSManifest,
  emittedGlobals: ServerCSSEmittedGlobals | undefined,
  renderSnapshot: RenderSnapshot
) {
  const InternalServerCSS = ServerCSS as unknown as InternalServerCSSConstructor
  return new InternalServerCSS(manifest, emittedGlobals, renderSnapshot)
}

export default function createServerCSS(
  manifest: MasterCSSManifest,
  emittedGlobals?: ServerCSSEmittedGlobals
) {
  return new ServerCSS(manifest, emittedGlobals)
}
