import { installHook } from '@master/css-devtools-hook'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import type Core from './core'
import startDebuggers from './debuggers'

declare global {
    var CSSRuntime: typeof Core
    var cssRuntime: Core
    var masterCSSManifest: MasterCSSManifest | undefined
}

export default function registerGlobal(CSSRuntime: typeof Core) {
    if (!globalThis.CSSRuntime) globalThis.CSSRuntime = CSSRuntime
    installHook()
    if (process.env.NODE_ENV === 'development') {
        startDebuggers()
    }
}
