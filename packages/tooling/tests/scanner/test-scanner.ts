import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  MasterCSSScanner as Scanner,
  type MasterCSSScannerConfiguration
} from '../../src/scanner'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export class MasterCSSScanner extends Scanner {
  constructor(
    options: MasterCSSScannerConfiguration & { manifest?: MasterCSSManifest } = {},
    cwd?: string
  ) {
    super({
      manifest: defaultManifest,
      ...options
    }, cwd)
  }
}
