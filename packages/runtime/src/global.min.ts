import CSSRuntime from './core'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

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
    try {
        const defaultManifestModule = await import(defaultManifestURL.href, { with: { type: 'json' } }) as { default: MasterCSSManifest }
        return defaultManifestModule.default
    } catch (error) {
        throw new Error(`Cannot load Master CSS default manifest from ${defaultManifestURL.href}.`, { cause: error })
    }
}

const currentScript = document.currentScript as HTMLScriptElement | null

if (currentScript?.src) {
    void loadDefaultManifest(currentScript.src)
        .then((manifest) => {
            const cssRuntime = CSSRuntime.create({ manifest })
            if (cssRuntime.needsHydrationManifest()) {
                return cssRuntime.loadHydrationManifest().then(() => cssRuntime.observe())
            }
            cssRuntime.observe()
        })
        .catch((error) => console.error(error))
} else {
    console.error('Cannot resolve the Master CSS runtime script URL.')
}
