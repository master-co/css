import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

// Local lowering fixtures explicitly supply their identity wrapper.
export const contentsManifest: MasterCSSManifest = {
  ...preset as unknown as MasterCSSManifest,
  mixins: [...preset.mixins as unknown as NonNullable<MasterCSSManifest['mixins']>, {
    name: '--all', body: [{ type: 'contents', fallback: [] }]
  }]
}
