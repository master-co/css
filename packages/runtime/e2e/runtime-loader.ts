import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { initCSSRuntime, initCSSRuntimeAsync, type MasterCSSHydrationManifest, type MasterCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export function startCSSRuntime(options: { manifest?: MasterCSSManifest, hydrationManifest?: MasterCSSHydrationManifest } = {}) {
    return initCSSRuntime({
        manifest: options.manifest || defaultManifest,
        hydrationManifest: options.hydrationManifest
    })
}

export function startCSSRuntimeAsync(options: { manifest?: MasterCSSManifest, hydrationManifest?: MasterCSSHydrationManifest } = {}) {
    return initCSSRuntimeAsync({
        manifest: options.manifest || defaultManifest,
        hydrationManifest: options.hydrationManifest
    })
}
