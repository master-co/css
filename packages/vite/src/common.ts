import {
    MASTER_CSS_CONFIG_QUERY as MASTER_CSS_CONFIG_REQUEST_QUERY,
    RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX as RESOLVED_MASTER_CSS_CONFIG_REQUEST_QUERY_PREFIX,
    VIRTUAL_CONFIG_ID as MASTER_CSS_VIRTUAL_CONFIG_ID
} from '@master/css-integration/config-module'
import { VIRTUAL_PRELOADED_ID as MASTER_CSS_VIRTUAL_PRELOADED_ID } from '@master/css-integration/preloaded-module'
import { CSS_RUNTIME_INJECTION } from '@master/css-integration/runtime'

export const HTML_ENTRIES = [
    'src/layouts/Layout.astro', // astro
    'src/app.html', // svelte
    'src/index.html',
    'app.html',
    'index.html',
]

export const VIRTUAL_CONFIG_ID = MASTER_CSS_VIRTUAL_CONFIG_ID
export const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`
export const VIRTUAL_PRELOADED_ID = MASTER_CSS_VIRTUAL_PRELOADED_ID
export const RESOLVED_VIRTUAL_PRELOADED_ID = `\0${VIRTUAL_PRELOADED_ID}`
export const MASTER_CSS_CONFIG_QUERY = MASTER_CSS_CONFIG_REQUEST_QUERY
export const RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX = RESOLVED_MASTER_CSS_CONFIG_REQUEST_QUERY_PREFIX
export { CSS_RUNTIME_INJECTION }
