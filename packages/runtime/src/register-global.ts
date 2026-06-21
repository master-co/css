import { installHook } from '@master/css-devtools-hook'
import type Core from './core'
import startDebuggers from './debuggers'

declare global {
    var MasterCSSRuntime: typeof Core
    var masterCSSRuntime: Core
}

export default function registerGlobal(CSSRuntime: typeof Core) {
    if (!globalThis.MasterCSSRuntime) globalThis.MasterCSSRuntime = CSSRuntime
    installHook()
    if (process.env.NODE_ENV === 'development') {
        startDebuggers()
    }
}
