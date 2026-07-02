import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import CSSRuntime, { type MasterCSSHydrationManifest, type MasterCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export function startCSSRuntime(options: { manifest?: MasterCSSManifest, hydrationManifest?: MasterCSSHydrationManifest } = {}) {
    return CSSRuntime.create({
        manifest: options.manifest || defaultManifest,
        hydrationManifest: options.hydrationManifest
    }).observe()
}

export async function startCSSRuntimeAsync(options: { manifest?: MasterCSSManifest, hydrationManifest?: MasterCSSHydrationManifest } = {}) {
    const cssRuntime = CSSRuntime.create({
        manifest: options.manifest || defaultManifest,
        hydrationManifest: options.hydrationManifest
    })
    if (cssRuntime.needsHydrationManifest()) await cssRuntime.loadHydrationManifest()
    return cssRuntime.observe()
}
