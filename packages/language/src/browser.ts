import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  initToolingWasm,
  type InitToolingWasmOptions
} from '@master/css-wasm-tooling'
import {
  bindLanguageSession,
  type LanguageSession
} from './rust-session'
import { defaultManifest } from './master-css'
import {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  SEMANTIC_TOKENS_LEGEND
} from './common'

export { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES, SEMANTIC_TOKENS_LEGEND }
export type { LanguageSession }

export interface BrowserLanguageSessionOptions {
  manifest?: MasterCSSManifest
  wasm?: InitToolingWasmOptions
}

export async function createLanguageSession(
  options: BrowserLanguageSessionOptions = {}
): Promise<LanguageSession> {
  const tooling = await initToolingWasm(options.wasm)
  const raw = new tooling.ToolingLanguageSession(
    stringifyMasterCSSManifestJSON(options.manifest || defaultManifest)
  )
  const backend = {
    analyzeDocument: (request: unknown) => raw.analyzeDocument(request),
    formatDirectives: (request: unknown) => raw.formatDirectives(request),
    nativeDeclarationCandidates: (classNames: string[]) => raw.nativeDeclarationCandidates(classNames),
    classifyClassNames: (classNames: string[], nativeSupport?: boolean[]) => raw.classifyClassNames(classNames, nativeSupport || []),
    inspectClassName: (className: string, nativeSupport?: boolean[], mode?: string) => raw.inspectClassName(className, nativeSupport || [], mode),
    completionIndex: () => raw.completionIndex(),
    colorPresentation: (token: string) => raw.colorPresentation(token),
    colorTokens: (candidates: unknown) => raw.colorTokens(candidates as never[]),
    dispose() {
      raw.dispose()
      raw.free()
    }
  }
  return bindLanguageSession('wasm', backend)
}

export { type InitToolingWasmOptions }
