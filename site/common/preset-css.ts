import { createCSSWithNativeDeclarations } from '@master/css-validator'
import type { MasterCSSManifest } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const presetCSS = createCSSWithNativeDeclarations(defaultManifest)

export const createPresetCSS = () => {
  return createCSSWithNativeDeclarations(defaultManifest)
}

export default presetCSS
