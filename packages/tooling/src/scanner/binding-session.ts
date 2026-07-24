import { createToolingBinding } from '@master/css-binding/tooling'
import { createToolingBindingSync } from '@master/css-binding/tooling/node'
import type {
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSValidatorBatch
} from '@master/css-binding/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { supportsNativeDeclaration } from '../host'
import { validateCSS } from '../css'

export interface BindingScannerUpdate {
  changed: boolean
  cacheHit: boolean
  candidates: string[]
  validClasses: string[]
  invalidClasses: string[]
  usedNativeClasses?: string[]
  transition: MasterCSSEngineTransition
}

export interface BindingScannerState {
  latentClasses: string[]
  validClasses: string[]
  invalidClasses: string[]
  nativeClasses?: string[]
  usedNativeClasses?: string[]
  cachedSources: number
  engine: MasterCSSEngineSnapshot
}

export interface BindingScannerSession {
  readonly binding: 'native' | 'wasm'
  extractCandidates(source: string, content: string): string[]
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklist: BindingScannerBlocklist[]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    blocklist: BindingScannerBlocklist[],
    nativeSupport: boolean[],
    invalidGeneratedClasses: string[]
  ): BindingScannerUpdate
  nativeDeclarationCandidates(candidates: string[]): MasterCSSNativeDeclarationCandidate[]
  generateValidationBatch(candidates: string[], nativeSupport: boolean[]): MasterCSSValidatorBatch
  invalidGeneratedClasses(batch: MasterCSSValidatorBatch, ruleSupport: boolean[][]): string[]
  ensureClasses(classNames: string[]): void
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): BindingScannerState
  dispose(): void
}

export type BindingScannerBlocklist = string | Readonly<{
  source: string
  flags: string
}>

export function serializeScannerBlocklist(blocklist: Iterable<string | RegExp> = []): BindingScannerBlocklist[] {
  return [...blocklist].map((entry) => typeof entry === 'string'
    ? entry
    : { source: entry.source, flags: entry.flags })
}

function bindScannerSession(
  binding: BindingScannerSession['binding'],
  session: ReturnType<ReturnType<typeof createToolingBindingSync>['createScannerSession']>,
  validator: ReturnType<ReturnType<typeof createToolingBindingSync>['createValidatorSession']>
): BindingScannerSession {
  return {
    binding,
    extractCandidates: (source, content) => [...session.extractCandidates(source, content)],
    scanCandidates(source, content, candidates, blocklist, nativeSupport, invalidGeneratedClasses) {
      return session.scanCandidates(
        source,
        content,
        candidates,
        blocklist,
        nativeSupport,
        invalidGeneratedClasses
      ) as BindingScannerUpdate
    },
    nativeDeclarationCandidates: (candidates) =>
      session.nativeDeclarationCandidates(candidates) as MasterCSSNativeDeclarationCandidate[],
    collectCandidates: (candidates) => [...session.collectCandidates(candidates)],
    filterCandidates: (candidates, blocklist) => [...session.filterCandidates(candidates, blocklist)],
    generateValidationBatch: (candidates, nativeSupport) =>
      validator.generateClassRules(
        candidates,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatch,
    invalidGeneratedClasses: (batch, ruleSupport) =>
      [...session.invalidGeneratedClasses(batch, ruleSupport)],
    ensureClasses(classNames) {
      session.ensureClassRules(classNames)
    },
    registerNativeClasses: (classNames) => session.registerNativeClassNames(classNames),
    reset: () => session.reset(),
    state: () => session.snapshot() as BindingScannerState,
    dispose() {
      session.dispose()
      validator.dispose()
    }
  }
}

export function createNativeScannerSession(manifest: MasterCSSManifest): BindingScannerSession {
  const tooling = createToolingBindingSync()
  return bindScannerSession(
    tooling.binding,
    tooling.createScannerSession(manifest),
    tooling.createValidatorSession(manifest)
  )
}

export async function createScannerSession(manifest: MasterCSSManifest): Promise<BindingScannerSession> {
  const tooling = await createToolingBinding()
  const [scanner, validator] = await Promise.all([
    tooling.createScannerSession(manifest),
    tooling.createValidatorSession(manifest)
  ])
  return bindScannerSession(tooling.binding, scanner, validator)
}

export function resolveNativeSupport(candidates: MasterCSSNativeDeclarationCandidate[]) {
  return candidates.map(supportsNativeDeclaration)
}

export function resolveGeneratedRuleSupport(batch: MasterCSSValidatorBatch) {
  return batch.classes
    .map((
      { rules }: MasterCSSValidatorBatch['classes'][number]
    ) => rules.map((
      { text }: MasterCSSValidatorBatch['classes'][number]['rules'][number]
    ) => validateCSS(text).length === 0))
}
