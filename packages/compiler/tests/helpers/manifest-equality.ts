import type { MasterCSSManifestReference } from '../../src'

/**
 * A compile result with its manifest read, so equality compares the manifest:
 * a reference has no enumerable fields of its own.
 */
export function withManifest<T extends { readonly manifest: MasterCSSManifestReference }>(result: T) {
  return { ...result, manifest: result.manifest.manifest() }
}
