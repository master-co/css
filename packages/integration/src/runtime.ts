import { VIRTUAL_MANIFEST_ID } from './manifest-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from './emitted-globals-module'

export const MASTER_CSS_RUNTIME_INJECTED_MARKER = '/*__MASTER_CSS_RUNTIME_INJECTED__*/'

export const CSS_RUNTIME_INJECTION = [
    `import { initCSSRuntime } from '@master/css-runtime';`,
    `import masterCSSManifest from '${VIRTUAL_MANIFEST_ID}';`,
    `import masterCSSEmittedGlobals from '${VIRTUAL_EMITTED_GLOBALS_ID}';`,
    `if (typeof document !== 'undefined') {`,
    `initCSSRuntime({ manifest: masterCSSManifest, emittedGlobals: masterCSSEmittedGlobals });`,
    `}`,
].join('\n')
