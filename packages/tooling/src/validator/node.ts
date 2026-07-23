import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { bindValidatorSession, type ValidatorSession } from './rust-session'

export type { ValidatorSession } from './rust-session'

export function createValidatorSync(manifest: MasterCSSManifest): ValidatorSession {
  const loaded = loadNativeBinding({ required: true })!
  return bindValidatorSession(
    'native',
    new loaded.binding.ValidatorSession(stringifyMasterCSSManifestJSON(manifest))
  )
}
