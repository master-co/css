import { createMasterCSSHandle } from './lib/server.js'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export const handle = createMasterCSSHandle({ manifest: defaultManifest })
