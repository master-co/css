import { VIRTUAL_PLAN_ID } from './plan-module'
import { VIRTUAL_PRELOADED_ID } from './preloaded-module'

export const MASTER_CSS_RUNTIME_INJECTED_MARKER = '/*__MASTER_CSS_RUNTIME_INJECTED__*/'

export const CSS_RUNTIME_INJECTION = [
    `import { initCSSRuntime } from '@master/css-runtime';`,
    `import masterCSSPlan from '${VIRTUAL_PLAN_ID}';`,
    `import masterCSSPreloaded from '${VIRTUAL_PRELOADED_ID}';`,
    `if (typeof document !== 'undefined') {`,
    `initCSSRuntime({ plan: masterCSSPlan, preloaded: masterCSSPreloaded });`,
    `}`,
].join('\n')
