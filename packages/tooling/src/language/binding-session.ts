import { createToolingBinding } from '@master/css-binding/tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { bindLanguageSession, type LanguageSession } from './session'

export {
  bindLanguageSession,
  type LanguageSession
} from './session'

export async function createLanguageSession(
  manifest: MasterCSSManifest,
  options: { readonly binding?: 'auto' | 'native' | 'wasm' } = {}
): Promise<LanguageSession> {
  const tooling = await createToolingBinding({ binding: options.binding })
  return bindLanguageSession(
    tooling.binding,
    await tooling.createLanguageSession(manifest)
  )
}
