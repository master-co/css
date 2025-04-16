const EXTENSIONS = '{js,ts,jsx,tsx,mjs,cjs,vue}'
const ENTRY_NAMES = '{app,main,index}'

export const ENTRY_MODULE_PATTERNS = [
    `src/${ENTRY_NAMES}.${EXTENSIONS}`,
    `${ENTRY_NAMES}.${EXTENSIONS}`,
]

export const virtualConfigId = 'virtual:master-css-config'
export const resolvedVirtualConfigId = `\0${virtualConfigId}`
