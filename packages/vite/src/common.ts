import {
    MASTER_CSS_MANIFEST_QUERY as MASTER_CSS_MANIFEST_REQUEST_QUERY,
    VIRTUAL_MANIFEST_ID as MASTER_CSS_VIRTUAL_MANIFEST_ID
} from '@master/css-integration/manifest-module'
import { RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX as RESOLVED_MASTER_CSS_MANIFEST_REQUEST_QUERY_PREFIX } from '@master/css-integration/node'
import { VIRTUAL_EMITTED_GLOBALS_ID as MASTER_CSS_VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-integration/emitted-globals-module'

export const HTML_ENTRIES = [
    'src/layouts/Layout.astro', // astro
    'src/app.html', // svelte
    'src/index.html',
    'app.html',
    'index.html',
]

export const VIRTUAL_MANIFEST_ID = MASTER_CSS_VIRTUAL_MANIFEST_ID
export const RESOLVED_VIRTUAL_MANIFEST_ID = `\0${VIRTUAL_MANIFEST_ID}`
export const VIRTUAL_EMITTED_GLOBALS_ID = MASTER_CSS_VIRTUAL_EMITTED_GLOBALS_ID
export const RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID = `\0${VIRTUAL_EMITTED_GLOBALS_ID}`
export const RUNTIME_ENTRY_ID = '@master/css.vite/runtime'
export const DEV_RUNTIME_ENTRY_ID = `/@id/${RUNTIME_ENTRY_ID}`
export const MASTER_CSS_MANIFEST_QUERY = MASTER_CSS_MANIFEST_REQUEST_QUERY
export const RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX = RESOLVED_MASTER_CSS_MANIFEST_REQUEST_QUERY_PREFIX
