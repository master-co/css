import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { bindLanguageSession, type LanguageSession } from './session'

export * from './session'

export function createNativeLanguageSession(
  manifestJSON: string,
  options: { required?: boolean } = {}
): LanguageSession | undefined {
  const loaded = loadNativeBinding({ required: options.required })
  if (!loaded) return
  return bindLanguageSession('native', new loaded.binding.LanguageSession(manifestJSON))
}

export async function createLanguageSession(manifest: MasterCSSManifest): Promise<LanguageSession> {
  const manifestJSON = stringifyMasterCSSManifestJSON(manifest)
  const native = createNativeLanguageSession(manifestJSON)
  if (native) return native
  const { initToolingWasm } = await import('@master/css-wasm-tooling')
  const tooling = await initToolingWasm()
  const session = new tooling.ToolingLanguageSession(manifestJSON)
  return bindLanguageSession('wasm', session)
}
