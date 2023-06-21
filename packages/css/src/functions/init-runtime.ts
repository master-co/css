import { MasterCSS } from '../core'
import type { Config } from '../config'

/**
 * Initialize a new MasterCSS instance and observe the target root
 * @param config master css config
 * @param targetRoot target root to observe
 * @returns master css instance
 */
export default function initRuntime(config?: Config, targetRoot?: Document | ShadowRoot | null): MasterCSS {
    return new MasterCSS(config).observe(targetRoot)
}