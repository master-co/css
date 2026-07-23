import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createToolingBackend,
  type MasterCSSWasmBackendLoadOptions
} from '@master/css-backend/tooling'
import {
  bindLanguageSession,
  type LanguageSession
} from './session'
import {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  SEMANTIC_TOKENS_LEGEND
} from './common'

export { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES, SEMANTIC_TOKENS_LEGEND }
export type { LanguageSession }

export interface BrowserLanguageSessionOptions {
  manifest: MasterCSSManifest
  wasm?: MasterCSSWasmBackendLoadOptions
}

export async function createLanguageSession(
  options: BrowserLanguageSessionOptions
): Promise<LanguageSession> {
  const tooling = await createToolingBackend({
    backend: 'wasm',
    wasm: options.wasm
  })
  return bindLanguageSession(
    tooling.backend,
    await tooling.createLanguageSession(options.manifest)
  )
}

export { type MasterCSSWasmBackendLoadOptions }
