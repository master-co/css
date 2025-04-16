const ENTRIES = '{main,app,index}.{js,ts,jsx,tsx,mjs,cjs,vue}'

export const ENTRY_MODULE_PATTERNS = [
    `resources/js/${ENTRIES}`, // laravel
    'src/layouts/Layout.astro', // astro
    'src/routes/+layout.svelte', // svelte
    `src/${ENTRIES}`,
    `${ENTRIES}`,
]

export const virtualConfigId = 'virtual:master-css-config'
export const resolvedVirtualConfigId = `\0${virtualConfigId}`
