import initCSSRuntime from './init'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

function resolveDefaultManifestURL(scriptURL: string) {
    const defaultManifestURL = new URL(scriptURL)
    defaultManifestURL.search = ''
    defaultManifestURL.hash = ''
    if (defaultManifestURL.pathname.endsWith('/')) {
        defaultManifestURL.pathname += 'default-manifest.json'
    } else if (defaultManifestURL.pathname.endsWith('.js')) {
        defaultManifestURL.pathname = defaultManifestURL.pathname.replace(/\/[^/]*$/, '/default-manifest.json')
    } else {
        defaultManifestURL.pathname += '/default-manifest.json'
    }
    return defaultManifestURL
}

async function loadDefaultManifest(scriptURL: string): Promise<MasterCSSManifest> {
    const defaultManifestURL = resolveDefaultManifestURL(scriptURL)
    const response = await fetch(defaultManifestURL, { credentials: 'same-origin' })
    if (!response.ok) {
        throw new Error(`Cannot load Master CSS default manifest from ${defaultManifestURL.href}.`)
    }
    return await response.json() as MasterCSSManifest
}

const currentScript = document.currentScript as HTMLScriptElement | null

if (currentScript?.src) {
    void loadDefaultManifest(currentScript.src)
        .then((manifest) => initCSSRuntime({ manifest }))
        .catch((error) => console.error(error))
} else {
    console.error('Cannot resolve the Master CSS runtime script URL.')
}
