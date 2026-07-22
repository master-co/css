import { loadNativeBinding } from '@master/css-native'
import type {
  MasterCSSEngineSnapshotIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSRegexIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'
import validateCSS from '@master/css-validator/validate-css'

export interface RustScannerUpdateIR {
  changed: boolean
  cacheHit: boolean
  candidates: string[]
  validClasses: string[]
  invalidClasses: string[]
  usedNativeClasses?: string[]
  transition: import('@master/css-schema').MasterCSSEngineTransitionIR
}

export interface RustScannerStateIR {
  latentClasses: string[]
  validClasses: string[]
  invalidClasses: string[]
  nativeClasses?: string[]
  usedNativeClasses?: string[]
  cachedSources: number
  engine: MasterCSSEngineSnapshotIR
}

export interface RustScannerSession {
  readonly backend: 'native' | 'wasm'
  extractCandidates(source: string, content: string): string[]
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklist: RustScannerBlocklistIR[]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    blocklist: RustScannerBlocklistIR[],
    nativeSupport: boolean[],
    invalidGeneratedClasses: string[]
  ): RustScannerUpdateIR
  nativeDeclarationCandidates(candidates: string[]): MasterCSSNativeDeclarationCandidateIR[]
  generateValidationBatch(candidates: string[], nativeSupport: boolean[]): MasterCSSValidatorBatchIR
  invalidGeneratedClasses(batch: MasterCSSValidatorBatchIR, ruleSupport: boolean[][]): string[]
  ensureClasses(classNames: string[]): void
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): RustScannerStateIR
  dispose(): void
}

export type RustScannerBlocklistIR = string | MasterCSSRegexIR

export function serializeScannerBlocklist(blocklist: Iterable<string | RegExp> = []): RustScannerBlocklistIR[] {
  return [...blocklist].map((entry) => typeof entry === 'string'
    ? entry
    : { source: entry.source, flags: entry.flags })
}

function parseNativeJSON<T>(source: string): T {
  return JSON.parse(source) as T
}

export function createNativeScannerSession(manifest: MasterCSSManifest): RustScannerSession | undefined {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const loaded = loadNativeBinding()
  if (loaded) {
    const session = new loaded.binding.ScannerSession(manifestJSON) as InstanceType<
      typeof loaded.binding.ScannerSession
    > & { extractCandidates(source: string, content: string): string[] }
    const validator = new loaded.binding.ValidatorSession(manifestJSON)
    return {
      backend: 'native',
      extractCandidates: (source, content) => session.extractCandidates(source, content),
      scanCandidates(source, content, candidates, blocklist, nativeSupport, invalidGeneratedClasses) {
        return parseNativeJSON(session.scanCandidates(
          source,
          content,
          candidates,
          JSON.stringify(blocklist),
          nativeSupport,
          invalidGeneratedClasses
        ))
      },
      nativeDeclarationCandidates: (candidates) =>
        parseNativeJSON(session.nativeDeclarationCandidates(candidates)),
      collectCandidates: (candidates) => session.collectCandidates(candidates),
      filterCandidates: (candidates, blocklist) => session.filterCandidates(candidates, JSON.stringify(blocklist)),
      generateValidationBatch: (candidates, nativeSupport) => parseNativeJSON(
        validator.generateClasses(candidates, nativeSupport.length ? nativeSupport : undefined)
      ),
      invalidGeneratedClasses: (batch, ruleSupport) =>
        session.invalidGeneratedClasses(JSON.stringify(batch), ruleSupport),
      ensureClasses(classNames) {
        session.ensureClasses(classNames)
      },
      registerNativeClasses: (classNames) => session.registerNativeClasses(classNames),
      reset: () => session.reset(),
      state: () => parseNativeJSON(session.state()),
      dispose() {
        session.dispose()
        validator.dispose()
      }
    }
  }
}

export async function createScannerSession(manifest: MasterCSSManifest): Promise<RustScannerSession> {
  const native = createNativeScannerSession(manifest)
  if (native) return native
  const { createToolingScannerSession, createToolingValidatorSession } = await import('@master/css-wasm-tooling')
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
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
  } as RustScannerSession
}

export function resolveNativeSupport(candidates: MasterCSSNativeDeclarationCandidateIR[]) {
  return candidates.map(cssTreeNativeDeclarationMatcher)
}

export function resolveGeneratedRuleSupport(batch: MasterCSSValidatorBatchIR) {
  return batch.classes
    .map(({ rules }) => rules.map(({ text }) => validateCSS(text).length === 0))
}
