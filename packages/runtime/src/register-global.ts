import { installHook } from '@master/css-devtools-hook'
import type { Config } from '@master/css'
import type Core from './core'
import startDebug from './debug'

declare global {
    var CSSRuntime: typeof Core
    var cssRuntimes: Core[]
    var cssRuntime: Core
    var masterCSSConfig: Config
    var masterCSSConfigs: Config[]
}

export default function registerGlobal(CSSRuntime: typeof Core) {
    if (!globalThis.CSSRuntime) globalThis.CSSRuntime = CSSRuntime
    if (!globalThis.cssRuntimes) globalThis.cssRuntimes = []
    installHook()
    if (process.env.NODE_ENV === 'development') {
        startDebug()
    }
}