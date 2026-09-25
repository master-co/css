import { createToolingBinding, type MasterCSSScannerSourceOptions, type MasterCSSScannerSourceInput, type MasterCSSScannerUpdate, type MasterCSSScannerState } from '@master/css-binding/tooling'
import { createToolingBindingSync } from '@master/css-binding/tooling/node'
import type { MasterCSSBindingLoadOptions } from '@master/css-binding/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export type BindingScannerUpdate = MasterCSSScannerUpdate
export type BindingScannerState = MasterCSSScannerState
export type ScannerSourceOptions = MasterCSSScannerSourceOptions
export type ScannerSourceInput = MasterCSSScannerSourceInput
export type BindingScannerBlocklist = string | Readonly<{ source: string, flags: string }>

export interface BindingScannerSession {
  readonly binding: 'native' | 'wasm'
  extractCandidates(source: string, content: string, options?: ScannerSourceOptions): string[]
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklist: BindingScannerBlocklist[]): string[]
  scanCandidates(source: string, content: string, candidates: string[], blocklist: BindingScannerBlocklist[], options?: ScannerSourceOptions): BindingScannerUpdate
  removeSource(source: string, options?: ScannerSourceOptions): BindingScannerUpdate
  reconcileSources(owner: string, inputs: readonly ScannerSourceInput[]): BindingScannerUpdate
  removeOwner(owner: string): BindingScannerUpdate
  ensureClasses(classNames: string[]): void
  registerNativeClasses(owner: string, classNames: string[]): boolean
  reset(): void
  state(): BindingScannerState
  dispose(): void
}

export function serializeScannerBlocklist(blocklist: Iterable<string | RegExp> = []): BindingScannerBlocklist[] {
  return [...blocklist].map((entry) => typeof entry === 'string' ? entry : { source: entry.source, flags: entry.flags })
}

function bindScannerSession(binding: BindingScannerSession['binding'], session: ReturnType<ReturnType<typeof createToolingBindingSync>['createScannerSession']>): BindingScannerSession {
  return {
    binding,
    extractCandidates: (source, content, options) => [...session.extractCandidates(source, content, options)],
    collectCandidates: (candidates) => [...session.collectCandidates(candidates)],
    filterCandidates: (candidates, blocklist) => [...session.filterCandidates(candidates, blocklist)],
    scanCandidates: (source, content, candidates, blocklist, options) => session.scanCandidates(source, content, candidates, blocklist, options),
    removeSource: (source, options) => session.removeSource(source, options),
    reconcileSources: (owner, inputs) => session.reconcileSources(owner, inputs),
    removeOwner: (owner) => session.removeOwner(owner),
    ensureClasses: (classes) => { session.ensureClassRules(classes) },
    registerNativeClasses: (owner, classes) => session.registerNativeClassNames(owner, classes),
    reset: () => session.reset(), state: () => session.snapshot(), dispose: () => session.dispose()
  }
}

export function createNativeScannerSession(manifest: MasterCSSManifest): BindingScannerSession {
  const tooling = createToolingBindingSync()
  return bindScannerSession(tooling.binding, tooling.createScannerSession(manifest))
}

export async function createScannerSession(manifest: MasterCSSManifest, options: MasterCSSBindingLoadOptions = {}): Promise<BindingScannerSession> {
  const tooling = await createToolingBinding(options)
  return bindScannerSession(tooling.binding, await tooling.createScannerSession(manifest))
}
