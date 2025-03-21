import { CSSRuntime } from './core'
import type { Config } from '@master/css'

/**
 * Initialize a new CSSRuntime instance and observe the target root
 * @param config master css config
 * @param targetRoot target root to observe
 * @returns master css instance
 */
export default function initCSSRuntime(config?: Config): CSSRuntime {
    return new CSSRuntime(document, config).observe()
}