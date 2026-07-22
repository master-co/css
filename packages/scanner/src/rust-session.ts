import { loadNativeBinding } from '@master/css-native'
import type {
  MasterCSSEngineSnapshotIR,
  MasterCSSNativeDeclarationCandidateIR
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { cssTreeNativeDeclarationMatcher } from '@master/css-validator/native-declaration-matcher'
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
    nativeSupport: Record<string, boolean>
  ): RustScannerUpdateIR
  nativeDeclarationCandidates(candidates: string[]): MasterCSSNativeDeclarationCandidateIR[]
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
    return {
      scanCandidates(source, content, candidates, excludedClasses, nativeSupport) {
        return parseNativeJSON(session.scanCandidates(
          source,
          content,
          candidates,
          excludedClasses,
          JSON.stringify(nativeSupport)
        ))
      },
      nativeDeclarationCandidates: (candidates) =>
        parseNativeJSON(session.nativeDeclarationCandidates(candidates)),
      collectCandidates: (candidates) => session.collectCandidates(candidates),
      ensureClasses(classNames) {
        session.ensureClasses(classNames)
      },
      registerNativeClasses: (classNames) => session.registerNativeClasses(classNames),
      reset: () => session.reset(),
      state: () => parseNativeJSON(session.state()),
      dispose: () => session.dispose()
    }
  }

  const [{ createToolingScannerSession }, wasmBytes] = await Promise.all([
    import('@master/css-wasm-tooling'),
    readFile(new URL(import.meta.resolve('@master/css-wasm-tooling/wasm')))
  ])
  return await createToolingScannerSession(manifestJSON, { input: new Uint8Array(wasmBytes) }) as RustScannerSession
}

export function resolveNativeSupport(candidates: MasterCSSNativeDeclarationCandidateIR[]) {
  const support: Record<string, boolean> = {}
  for (const candidate of candidates) {
    support[candidate.className] = cssTreeNativeDeclarationMatcher(candidate)
  }
  return support
}
