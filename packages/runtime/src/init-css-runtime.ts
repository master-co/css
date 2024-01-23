import { RuntimeCSS } from './core'
import type { Config } from '@master/css'

/**
 * Initialize a new RuntimeCSS instance and observe the target root
 * @param config master css config
 * @param targetRoot target root to observe
 * @returns master css instance
 */
export default function initCSSRuntime(config?: Config): RuntimeCSS {
    return new RuntimeCSS(document, config).observe()
}