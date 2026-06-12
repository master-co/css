import CSSRuntime from './core'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import type { MasterCSSPreloaded } from '@master/css-engine/preloaded'

export interface CSSRuntimeInitOptions {
    plan?: MasterCSSPlan
    root?: Document | ShadowRoot
    autoObserve?: boolean
    preloaded?: MasterCSSPreloaded
}

/**
 * Initialize a new CSSRuntime instance and observe the target root
 * @param options runtime options
 * @returns master css instance
 */
export default function initCSSRuntime(options: CSSRuntimeInitOptions = {}): CSSRuntime {
    const {
        plan = { version: 1 },
        root = document,
        autoObserve = true,
        preloaded
    } = options
    let cssRuntime = globalThis.CSSRuntime.instances.get(root)
    if (cssRuntime) {
        cssRuntime.registerPreloaded(preloaded)
        return cssRuntime
    }
    cssRuntime = new CSSRuntime(root, plan, preloaded)
    if (autoObserve) cssRuntime.observe()
    return cssRuntime
}
