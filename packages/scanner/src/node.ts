import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { NativeBindingError } from '@master/css-native'
import { createNativeScannerSession, type RustScannerSession } from './rust-session'

export type ScannerSession = RustScannerSession

export function createScannerSync(manifest: MasterCSSManifest): ScannerSession {
  const session = createNativeScannerSession(manifest)
  if (session) return session
  throw new NativeBindingError(
    'NATIVE_UNAVAILABLE',
    'createScannerSync() requires the Master CSS native binding.'
  )
}
