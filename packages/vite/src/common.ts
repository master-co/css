export const ENTRY_MODULE_PATTERNS = [
    'src/main.{js,ts,jsx,tsx,mjs,cjs}',
    'src/index.{js,ts,jsx,tsx,mjs,cjs}',
    'src/app.{js,ts,jsx,tsx,mjs,cjs}',
    'index.{js,ts,jsx,tsx,mjs,cjs}',
]

export enum Modes {
    runtime = 'Runtime Rendering',
    extract = 'Static Extraction',
    progressive = 'Progressive Hydration'
}