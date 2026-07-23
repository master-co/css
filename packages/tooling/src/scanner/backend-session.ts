import { createToolingBackend } from '@master/css-backend/tooling'
import { createToolingBackendSync } from '@master/css-backend/tooling/node'
import type {
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSValidatorBatch
} from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { supportsNativeDeclaration } from '../host'
import { validateCSS } from '../css'

export interface BackendScannerUpdate {
  changed: boolean
  cacheHit: boolean
  candidates: string[]
  validClasses: string[]
  invalidClasses: string[]
  usedNativeClasses?: string[]
  transition: MasterCSSEngineTransition
}

export interface BackendScannerState {
  latentClasses: string[]
  validClasses: string[]
  invalidClasses: string[]
  nativeClasses?: string[]
  usedNativeClasses?: string[]
  cachedSources: number
  engine: MasterCSSEngineSnapshot
}

export interface BackendScannerSession {
  readonly backend: 'native' | 'wasm'
  extractCandidates(source: string, content: string): string[]
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklist: BackendScannerBlocklist[]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    blocklist: BackendScannerBlocklist[],
    nativeSupport: boolean[],
    invalidGeneratedClasses: string[]
  ): BackendScannerUpdate
  nativeDeclarationCandidates(candidates: string[]): MasterCSSNativeDeclarationCandidate[]
  generateValidationBatch(candidates: string[], nativeSupport: boolean[]): MasterCSSValidatorBatch
  invalidGeneratedClasses(batch: MasterCSSValidatorBatch, ruleSupport: boolean[][]): string[]
  ensureClasses(classNames: string[]): void
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): BackendScannerState
  dispose(): void
}

export type BackendScannerBlocklist = string | Readonly<{
  source: string
  flags: string
}>

export function serializeScannerBlocklist(blocklist: Iterable<string | RegExp> = []): BackendScannerBlocklist[] {
  return [...blocklist].map((entry) => typeof entry === 'string'
    ? entry
    : { source: entry.source, flags: entry.flags })
}

function bindScannerSession(
  backend: BackendScannerSession['backend'],
  session: ReturnType<ReturnType<typeof createToolingBackendSync>['createScannerSession']>,
  validator: ReturnType<ReturnType<typeof createToolingBackendSync>['createValidatorSession']>
): BackendScannerSession {
  return {
    backend,
    extractCandidates: (source, content) => [...session.extractCandidates(source, content)],
    scanCandidates(source, content, candidates, blocklist, nativeSupport, invalidGeneratedClasses) {
      return session.scanCandidates(
        source,
        content,
        candidates,
        blocklist,
        nativeSupport,
        invalidGeneratedClasses
      ) as BackendScannerUpdate
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
    state: () => session.snapshot() as BackendScannerState,
    dispose() {
      session.dispose()
      validator.dispose()
    }
  }
}

export function createNativeScannerSession(manifest: MasterCSSManifest): BackendScannerSession {
  const tooling = createToolingBackendSync()
  return bindScannerSession(
    tooling.backend,
    tooling.createScannerSession(manifest),
    tooling.createValidatorSession(manifest)
  )
}

export async function createScannerSession(manifest: MasterCSSManifest): Promise<BackendScannerSession> {
  const tooling = await createToolingBackend()
  const [scanner, validator] = await Promise.all([
    tooling.createScannerSession(manifest),
    tooling.createValidatorSession(manifest)
  ])
  return bindScannerSession(tooling.backend, scanner, validator)
}

export function resolveNativeSupport(candidates: MasterCSSNativeDeclarationCandidate[]) {
  return candidates.map(supportsNativeDeclaration)
}

export function resolveGeneratedRuleSupport(batch: MasterCSSValidatorBatch) {
  return batch.classes
    .map(({ rules }) => rules.map(({ text }) => validateCSS(text).length === 0))
}
