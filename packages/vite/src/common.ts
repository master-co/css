const EXTENSIONS = '{js,ts,jsx,tsx,mjs,cjs,vue}'
const ENTRY_NAMES = '{main,app,index}'

export const ENTRY_MODULE_PATTERNS = [
    'src/layouts/Layout.astro',
    'src/routes/+layout.svelte',
    `src/${ENTRY_NAMES}.${EXTENSIONS}`,
    `${ENTRY_NAMES}.${EXTENSIONS}`,
]

export const virtualConfigId = 'virtual:master-css-config'
export const resolvedVirtualConfigId = `\0${virtualConfigId}`
