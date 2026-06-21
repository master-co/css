import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { initCSSRuntime, type MasterCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export function startCSSRuntime(options: { manifest?: MasterCSSManifest } = {}) {
    return initCSSRuntime({ manifest: options.manifest || defaultManifest })
}
