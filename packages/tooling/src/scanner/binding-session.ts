import { createToolingBinding } from '@master/css-binding/tooling'
import { createToolingBindingSync } from '@master/css-binding/tooling/node'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition
} from '@master/css-binding/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

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
  cachedSourceCandidates(source: string, content: string): readonly string[] | null
  extractCandidates(source: string, content: string): string[]
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklist: BindingScannerBlocklist[]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    blocklist: BindingScannerBlocklist[]
  ): BindingScannerUpdate
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
  session: ReturnType<ReturnType<typeof createToolingBindingSync>['createScannerSession']>
): BindingScannerSession {
  return {
    binding,
    cachedSourceCandidates: (source, content) => session.cachedSourceCandidates(source, content),
    extractCandidates: (source, content) => [...session.extractCandidates(source, content)],
    scanCandidates(source, content, candidates, blocklist) {
      return session.scanCandidates(
        source,
        content,
        candidates,
        blocklist,
        [],
        []
      ) as BindingScannerUpdate
    },
    collectCandidates: (candidates) => [...session.collectCandidates(candidates)],
    filterCandidates: (candidates, blocklist) => [...session.filterCandidates(candidates, blocklist)],
    ensureClasses(classNames) {
      session.ensureClassRules(classNames)
    },
    registerNativeClasses: (classNames) => session.registerNativeClassNames(classNames),
    reset: () => session.reset(),
    state: () => session.snapshot() as BindingScannerState,
    dispose() {
      session.dispose()
    }
  }
}

export function createNativeScannerSession(manifest: MasterCSSManifest): BindingScannerSession {
  const tooling = createToolingBindingSync()
  return bindScannerSession(
    tooling.binding,
    tooling.createScannerSession(manifest)
  )
}

export async function createScannerSession(manifest: MasterCSSManifest, options: MasterCSSBindingLoadOptions = {}): Promise<BindingScannerSession> {
  const tooling = await createToolingBinding(options)
  const scanner = await tooling.createScannerSession(manifest)
  return bindScannerSession(tooling.binding, scanner)
}
