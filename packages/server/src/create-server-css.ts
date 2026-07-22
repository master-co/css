import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSServerRenderIR
} from '@master/css-schema/rust-contract'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'

export interface ServerCSSEmittedGlobals {
  variables?: Record<string, number>
  animations?: Record<string, number>
}

export class ServerCSS {
  readonly classUtilities = new Map<string, MasterCSSServerRenderIR['snapshot']['rules']>()
  private readonly session
  private currentSnapshot?: MasterCSSServerRenderIR

  constructor(
    public readonly manifest: MasterCSSManifest,
    emittedGlobals?: ServerCSSEmittedGlobals
  ) {
    const loaded = loadNativeBinding({ required: true })!
    this.session = new loaded.binding.RenderSession(
      stringifyMasterCSSManifestJSON(manifest),
      emittedGlobals ? JSON.stringify(emittedGlobals) : undefined
    )
  }

  ensureClassRules(...classNames: string[]) {
    const candidates = JSON.parse(
      this.session.nativeDeclarationCandidates(classNames)
    ) as MasterCSSNativeDeclarationCandidateIR[]
    const support = candidates.map(cssTreeNativeDeclarationMatcher)
    this.session.ensureClasses(classNames, support.length ? support : undefined)
    this.currentSnapshot = undefined
    this.syncClassUtilities()
    return this
  }

  snapshot() {
    this.currentSnapshot ||= JSON.parse(this.session.snapshot()) as MasterCSSServerRenderIR
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
    this.session.dispose()
  }
}

export default function createServerCSS(
  manifest: MasterCSSManifest,
  emittedGlobals?: ServerCSSEmittedGlobals
) {
  return new ServerCSS(manifest, emittedGlobals)
}
