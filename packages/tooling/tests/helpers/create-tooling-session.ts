import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../../src/node'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export function createTestToolingSession(
  manifest: MasterCSSManifest = defaultManifest
) {
  return createToolingSessionSync({ manifest })
}
