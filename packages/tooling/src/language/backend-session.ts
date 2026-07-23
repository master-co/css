import { loadNativeToolingBackend } from '@master/css-backend/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { bindLanguageSession, type LanguageSession } from './session'

export {
  bindLanguageSession,
  type LanguageSession
} from './session'

export function createNativeLanguageSession(
  manifest: MasterCSSManifest,
  options: { required?: boolean } = {}
): LanguageSession | undefined {
  const tooling = loadNativeToolingBackend({ required: options.required })
  if (!tooling) return
  return bindLanguageSession('native', tooling.createLanguageSession(manifest))
}

export async function createLanguageSession(
  manifest: MasterCSSManifest,
  options: { readonly backend?: 'auto' | 'native' | 'wasm' } = {}
): Promise<LanguageSession> {
  const manifestJSON = serializeMasterCSSManifest(manifest)
  if (options.backend !== 'wasm') {
    const native = createNativeLanguageSession(manifest, {
      required: options.backend === 'native'
    })
    if (native) return native
  }
  const { initToolingWasm } = await import('@master/css-wasm-tooling')
  const tooling = await initToolingWasm()
  const session = new tooling.ToolingLanguageSession(manifestJSON)
  return bindLanguageSession('wasm', session)
}
