import CSSRuntime from './core'
import defaultConfig from '@master/css/config'
import { extendConfig } from '@master/css/utils'
import type { Config } from 'shared/css-config'

/**
 * Initialize a new CSSRuntime instance and observe the target root
 * @param config master css config
 * @param root target root to observe
 * @param autoObserve auto observe the target root
 * @returns master css instance
 */
export default function initCSSRuntime(config?: Config, root: Document | ShadowRoot = document, autoObserve = true): CSSRuntime {
    let cssRuntime = globalThis.CSSRuntime.instances.get(root)
    if (cssRuntime) return cssRuntime
    cssRuntime = new CSSRuntime(root, extendConfig(defaultConfig, config))
    if (autoObserve) cssRuntime.observe()
    return cssRuntime
}
