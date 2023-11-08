import { RuntimeCSS } from '../runtime'
import type { Config } from '../config'

/**
 * Initialize a new MasterCSS instance and observe the target root
 * @param config master css config
 * @param targetRoot target root to observe
 * @returns master css instance
 */
export default function initRuntime(config?: Config): RuntimeCSS {
    return new RuntimeCSS(document, config).observe()
}