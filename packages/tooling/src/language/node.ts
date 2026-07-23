import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import {
  createNativeLanguageSession,
  type LanguageSession
} from './rust-session'

export type { LanguageSession } from './rust-session'

export function createLanguageSessionSync(manifest: MasterCSSManifest): LanguageSession {
  return createNativeLanguageSession(stringifyMasterCSSManifestJSON(manifest), { required: true })!
}
