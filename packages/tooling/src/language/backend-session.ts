import { createToolingBackend } from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { bindLanguageSession, type LanguageSession } from './session'

export {
  bindLanguageSession,
  type LanguageSession
} from './session'

export async function createLanguageSession(
  manifest: MasterCSSManifest,
  options: { readonly backend?: 'auto' | 'native' | 'wasm' } = {}
): Promise<LanguageSession> {
  const tooling = await createToolingBackend({ backend: options.backend })
  return bindLanguageSession(
    tooling.backend,
    await tooling.createLanguageSession(manifest)
  )
}
