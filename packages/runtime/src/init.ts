import CSSRuntime from './core'
import type { Config } from '@master/css'
import type { MasterCSSPreloaded } from '@master/css/preloaded'
import { resolveRuntimeConfig } from './config'

export interface CSSRuntimeInitOptions {
    config?: Config
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
        config,
        root = document,
        autoObserve = true,
        preloaded
    } = options
    let cssRuntime = globalThis.CSSRuntime.instances.get(root)
    if (cssRuntime) return cssRuntime
    cssRuntime = new CSSRuntime(root, resolveRuntimeConfig(config), preloaded)
    if (autoObserve) cssRuntime.observe()
    return cssRuntime
}
