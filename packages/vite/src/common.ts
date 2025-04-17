const ENTRIES = '{main,app,index}.{js,ts,jsx,tsx,mjs,cjs,vue}'

export const ENTRY_MODULE_PATTERNS = [
    `resources/js/${ENTRIES}`, // laravel
    'src/layouts/Layout.astro', // astro
    'src/routes/+layout.svelte', // svelte
    `src/${ENTRIES}`,
    `${ENTRIES}`,
]

export const INDEX_HTML_ENTRIES = [
    'src/layouts/Layout.astro', // astro
]

export const VIRTUAL_CONFIG_ID = 'virtual:master-css-config'
export const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`
export const CSS_RUNTIME_INJECTIOIN = [
    `import { initCSSRuntime } from '@master/css-runtime';`,
    `import config from 'virtual:master-css-config';`,
    `initCSSRuntime(config);`
].join('\n')