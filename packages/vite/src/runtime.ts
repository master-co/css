/// <reference types="@master/css-integration/client" />
/// <reference types="vite/client" />

import CSSRuntime from '@master/css-runtime'
import masterCSSManifest from 'virtual:master-css-manifest'
import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'

type RuntimeManifestModule = { default: typeof masterCSSManifest }
type RuntimeEmittedGlobalsModule = { default: typeof masterCSSEmittedGlobals }

let masterCSSRuntime: CSSRuntime | undefined

function destroyRuntime() {
    masterCSSRuntime?.destroy()
    masterCSSRuntime = undefined
}

async function startRuntime(
    manifest = masterCSSManifest,
    emittedGlobals = masterCSSEmittedGlobals
) {
    if (typeof document === 'undefined') return
    destroyRuntime()
    const nextRuntime = CSSRuntime.create({
        manifest,
        emittedGlobals
    })
    if (nextRuntime.needsHydrationManifest()) {
        await nextRuntime.loadHydrationManifest()
    }
    masterCSSRuntime = nextRuntime.observe()
}

if (typeof document !== 'undefined') {
    void startRuntime()
}

if (import.meta.hot) {
    import.meta.hot.accept(() => {})
    import.meta.hot.accept([
        'virtual:master-css-manifest',
        'virtual:master-css-emitted-globals'
    ], (modules) => {
        const [manifestModule, emittedGlobalsModule] = modules as [
            RuntimeManifestModule | undefined,
            RuntimeEmittedGlobalsModule | undefined
        ]
        void startRuntime(
            manifestModule?.default ?? masterCSSManifest,
            emittedGlobalsModule?.default ?? masterCSSEmittedGlobals
        )
    })
    import.meta.hot.dispose(destroyRuntime)
}
