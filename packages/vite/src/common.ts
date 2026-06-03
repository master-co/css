import {
    MASTER_CSS_CONFIG_QUERY as MASTER_CSS_CONFIG_REQUEST_QUERY,
    RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX as RESOLVED_MASTER_CSS_CONFIG_REQUEST_QUERY_PREFIX,
    VIRTUAL_CONFIG_ID as MASTER_CSS_VIRTUAL_CONFIG_ID
} from '@master/css-configer/module'

export const HTML_ENTRIES = [
    'src/layouts/Layout.astro', // astro
    'src/app.html', // svelte
    'src/index.html',
    'app.html',
    'index.html',
]

export const VIRTUAL_CONFIG_ID = MASTER_CSS_VIRTUAL_CONFIG_ID
export const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`
export const MASTER_CSS_CONFIG_QUERY = MASTER_CSS_CONFIG_REQUEST_QUERY
export const RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX = RESOLVED_MASTER_CSS_CONFIG_REQUEST_QUERY_PREFIX
export const CSS_RUNTIME_INJECTION = [
    `import { initCSSRuntime } from '@master/css-runtime';`,
    `import masterCSSConfig from 'virtual:master-css-config';`,
    `if (typeof document !== 'undefined') {`,
    `initCSSRuntime(masterCSSConfig);`,
    `}`,
].join('\n')
