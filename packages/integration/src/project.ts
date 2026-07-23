import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export const defaultBuildManifest = Object.freeze(
  defaultManifestJSON as unknown as MasterCSSManifest
)

export function createManifestEntryPattern() {
  return /(?:@master\s+entry\s*;|@import\s+(?:url\(\s*)?(['"])@master\/css\1\s*\)?[^;]*;)/
}

export function cleanManifestStylesheetRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

export function isManifestStylesheetRequest(id: string) {
  return cleanManifestStylesheetRequest(id).endsWith('.css')
}
