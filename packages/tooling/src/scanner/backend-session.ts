import { loadNativeToolingBackend } from '@master/css-backend/tooling'
import type {
  MasterCSSEngineSnapshotIR,
  MasterCSSEngineTransitionIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSRegexIR,
  MasterCSSValidatorBatchIR
} from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { supportsNativeDeclaration } from '../host'
import { validateCSS } from '../css'

export interface BackendScannerUpdate {
  changed: boolean
  cacheHit: boolean
  candidates: string[]
  validClasses: string[]
  invalidClasses: string[]
  usedNativeClasses?: string[]
  transition: MasterCSSEngineTransitionIR
}

export interface BackendScannerState {
  latentClasses: string[]
  validClasses: string[]
  invalidClasses: string[]
  nativeClasses?: string[]
  usedNativeClasses?: string[]
  cachedSources: number
  engine: MasterCSSEngineSnapshotIR
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
  nativeDeclarationCandidates(candidates: string[]): MasterCSSNativeDeclarationCandidateIR[]
  generateValidationBatch(candidates: string[], nativeSupport: boolean[]): MasterCSSValidatorBatchIR
  invalidGeneratedClasses(batch: MasterCSSValidatorBatchIR, ruleSupport: boolean[][]): string[]
  ensureClasses(classNames: string[]): void
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): BackendScannerState
  dispose(): void
}

export type BackendScannerBlocklist = string | MasterCSSRegexIR

export function serializeScannerBlocklist(blocklist: Iterable<string | RegExp> = []): BackendScannerBlocklist[] {
  return [...blocklist].map((entry) => typeof entry === 'string'
    ? entry
    : { source: entry.source, flags: entry.flags })
}

export function createNativeScannerSession(manifest: MasterCSSManifest): BackendScannerSession | undefined {
  const tooling = loadNativeToolingBackend()
  if (tooling) {
    const session = tooling.createScannerSession(manifest)
    const validator = tooling.createValidatorSession(manifest)
    return {
      backend: 'native',
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
        session.nativeDeclarationCandidates(candidates) as MasterCSSNativeDeclarationCandidateIR[],
      collectCandidates: (candidates) => [...session.collectCandidates(candidates)],
      filterCandidates: (candidates, blocklist) => [...session.filterCandidates(candidates, blocklist)],
      generateValidationBatch: (candidates, nativeSupport) =>
        validator.generateClassRules(
          candidates,
          nativeSupport.length ? nativeSupport : undefined
        ) as MasterCSSValidatorBatchIR,
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
}

export async function createScannerSession(manifest: MasterCSSManifest): Promise<BackendScannerSession> {
  const native = createNativeScannerSession(manifest)
  if (native) return native
  const { createToolingScannerSession, createToolingValidatorSession } = await import('@master/css-wasm-tooling')
  const manifestJSON = serializeMasterCSSManifest(manifest)
  const [scanner, validator] = await Promise.all([
    createToolingScannerSession(manifestJSON),
    createToolingValidatorSession(manifestJSON)
  ])
  return {
    backend: 'wasm',
    ...scanner,
    generateValidationBatch(candidates, nativeSupport) {
      return validator.generateClasses(
        candidates,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatchIR
    },
    dispose() {
      scanner.dispose()
      validator.dispose()
    }
  } as BackendScannerSession
}

export function resolveNativeSupport(candidates: MasterCSSNativeDeclarationCandidateIR[]) {
  return candidates.map(supportsNativeDeclaration)
}

export function resolveGeneratedRuleSupport(batch: MasterCSSValidatorBatchIR) {
  return batch.classes
    .map(({ rules }) => rules.map(({ text }) => validateCSS(text).length === 0))
}
