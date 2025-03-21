import CSSRuntime from './core'
import type { Config } from '@master/css'

/**
 * Initialize a new CSSRuntime instance and observe the target root
 * @param config master css config
 * @param root target root to observe
 * @param autoObserve auto observe the target root
 * @returns master css instance
 */
export default function initCSSRuntime(config?: Config, root: Document | ShadowRoot = document, autoObserve = true): CSSRuntime {
    let cssRuntime = globalThis.cssRuntimes.find((eachCSS: CSSRuntime) => eachCSS.root === root)
    if (cssRuntime) return cssRuntime
    cssRuntime = new CSSRuntime(document, config)
    if (autoObserve) cssRuntime.observe()
    return cssRuntime
}