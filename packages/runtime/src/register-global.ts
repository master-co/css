import { installHook } from '@master/css-devtools-hook'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import type Core from './core'
import startDebuggers from './debuggers'

declare global {
    var CSSRuntime: typeof Core
    var cssRuntime: Core
    var masterCSSPlan: MasterCSSPlan | undefined
}

export default function registerGlobal(CSSRuntime: typeof Core) {
    if (!globalThis.CSSRuntime) globalThis.CSSRuntime = CSSRuntime
    installHook()
    if (process.env.NODE_ENV === 'development') {
        startDebuggers()
    }
}
