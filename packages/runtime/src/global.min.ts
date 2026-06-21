import initCSSRuntime from './init'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

async function loadDefaultManifest(): Promise<MasterCSSManifest> {
    const defaultManifestURL = new URL('./default-manifest.json', import.meta.url)
    const defaultManifestModule = await import(defaultManifestURL.href, { with: { type: 'json' } }) as { default: MasterCSSManifest }
    return defaultManifestModule.default
}

if (globalThis.masterCSSManifest) {
    initCSSRuntime({ manifest: globalThis.masterCSSManifest })
} else {
    void loadDefaultManifest().then((manifest) => initCSSRuntime({ manifest }))
}
