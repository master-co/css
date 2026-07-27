import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { MasterCSSLanguageService } from '../../src/core'
import type { MasterCSSLanguageServiceSettings } from '../../src/settings'

export type Settings = MasterCSSLanguageServiceSettings

export default class RC87LanguageService extends MasterCSSLanguageService {
  constructor(settings: Settings = {}) {
    const manifest = settings.manifest
      ?? defaultManifestJSON as unknown as MasterCSSManifest
    super(settings, { session: createToolingSessionSync({ manifest }) })
  }
}
