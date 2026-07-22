import { loadNativeBinding } from '@master/css-native'
import type {
  MasterCSSEngineSnapshotIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSValidatorBatchIR
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'
import validateCSS from '@master/css-validator/validate-css'
import { readFile } from 'node:fs/promises'

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
  collectCandidates(candidates: string[]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    excludedClasses: string[],
    nativeSupport: boolean[],
    invalidGeneratedClasses: string[]
  ): RustScannerUpdateIR
  nativeDeclarationCandidates(candidates: string[]): MasterCSSNativeDeclarationCandidateIR[]
  invalidGeneratedClasses(candidates: string[], nativeSupport: boolean[]): string[]
  ensureClasses(classNames: string[]): void
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): RustScannerStateIR
  dispose(): void
}

function parseNativeJSON<T>(source: string): T {
  return JSON.parse(source) as T
}

export async function createRustScannerSession(manifest: MasterCSSManifest): Promise<RustScannerSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const loaded = loadNativeBinding()
  if (loaded) {
    const session = new loaded.binding.ScannerSession(manifestJSON)
    const validator = new loaded.binding.ValidatorSession(manifestJSON)
    return {
      scanCandidates(source, content, candidates, excludedClasses, nativeSupport, invalidGeneratedClasses) {
        return parseNativeJSON(session.scanCandidates(
          source,
          content,
          candidates,
          excludedClasses,
          nativeSupport,
          invalidGeneratedClasses
        ))
      },
      nativeDeclarationCandidates: (candidates) =>
        parseNativeJSON(session.nativeDeclarationCandidates(candidates)),
      invalidGeneratedClasses(candidates, nativeSupport) {
        return collectInvalidGeneratedClasses(parseNativeJSON(
          validator.generateClasses(candidates, nativeSupport.length ? nativeSupport : undefined)
        ))
      },
      collectCandidates: (candidates) => session.collectCandidates(candidates),
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

  const [{ createToolingScannerSession, createToolingValidatorSession }, wasmBytes] = await Promise.all([
    import('@master/css-wasm-tooling'),
    readFile(new URL(import.meta.resolve('@master/css-wasm-tooling/wasm')))
  ])
  const input = new Uint8Array(wasmBytes)
  const [scanner, validator] = await Promise.all([
    createToolingScannerSession(manifestJSON, { input }),
    createToolingValidatorSession(manifestJSON, { input })
  ])
  return {
    ...scanner,
    invalidGeneratedClasses(candidates, nativeSupport) {
      return collectInvalidGeneratedClasses(validator.generateClasses(
        candidates,
        nativeSupport.length ? nativeSupport : undefined
      ) as MasterCSSValidatorBatchIR)
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

function collectInvalidGeneratedClasses(batch: MasterCSSValidatorBatchIR) {
  return batch.classes
    .filter(({ matched, rules }) => matched && rules.some(({ text }) => validateCSS(text).length))
    .map(({ className }) => className)
}
