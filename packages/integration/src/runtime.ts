import { VIRTUAL_CONFIG_ID } from './config-module'
import { VIRTUAL_PRELOADED_ID } from './preloaded-module'

export const MASTER_CSS_RUNTIME_INJECTED_MARKER = '/*__MASTER_CSS_RUNTIME_INJECTED__*/'

export const CSS_RUNTIME_INJECTION = [
    `import { initCSSRuntime } from '@master/css-runtime';`,
    `import masterCSSConfig from '${VIRTUAL_CONFIG_ID}';`,
    `import masterCSSPreloaded from '${VIRTUAL_PRELOADED_ID}';`,
    `if (typeof document !== 'undefined') {`,
    `initCSSRuntime({ config: masterCSSConfig, preloaded: masterCSSPreloaded });`,
    `}`,
].join('\n')
