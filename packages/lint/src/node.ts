import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import {
  createNativeLintSession,
  fromRustLintDiagnostics,
  type LintSession,
  type RustLintClassListOptions
} from './rust-session'

export type { LintSession, RustLintClassListOptions }
export { fromRustLintDiagnostics }

export function createLintSessionSync(manifest: MasterCSSManifest): LintSession {
  return createNativeLintSession(stringifyMasterCSSManifestJSON(manifest), { required: true })!
}
