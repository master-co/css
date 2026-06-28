/// <reference types="@master/css-integration/client" />

import { CSSRuntime } from '@master/css-runtime'
import masterCSSManifest from 'virtual:master-css-manifest'
import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'

if (typeof document !== 'undefined') {
    const masterCSSRuntime = CSSRuntime.create({
        manifest: masterCSSManifest,
        emittedGlobals: masterCSSEmittedGlobals
    })
    if (masterCSSRuntime.needsHydrationManifest()) {
        void masterCSSRuntime.loadHydrationManifest().then(() => masterCSSRuntime.observe())
    } else {
        masterCSSRuntime.observe()
    }
}
