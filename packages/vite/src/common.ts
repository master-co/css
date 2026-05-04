const ENTRIES = '{main,app,index}.{js,ts,jsx,tsx,mjs,cjs,vue}'

export const ENTRY_MODULE_PATTERNS = [
    `resources/js/${ENTRIES}`, // laravel
    'src/layouts/Layout.astro', // astro
    'src/routes/+layout.svelte', // svelte
    `src/${ENTRIES}`,
    `${ENTRIES}`,
]

export const HTML_ENTRIES = [
    'src/layouts/Layout.astro', // astro
    'src/app.html', // svelte
    'src/index.html',
    'app.html',
    'index.html',
]

export const VIRTUAL_CONFIG_ID = 'virtual:master-css-config'
export const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`
export const MASTER_CSS_CONFIG_QUERY = '?master-css-config'
export const RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX = '\0master-css-config:'
export const CSS_RUNTIME_INJECTIOIN = [
    `import { initCSSRuntime } from '@master/css-runtime';`,
    `import masterCSSConfig from 'virtual:master-css-config';`,
    `if (typeof document !== 'undefined') {`,
    `initCSSRuntime(masterCSSConfig);`,
    `}`,
].join('\n')
