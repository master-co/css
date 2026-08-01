const shikiLanguageIds: Record<string, string> = {
  html: 'html',
  'angular-html': 'angular-html',
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'jsx',
  javascriptreact: 'jsx',
  ts: 'typescript',
  typescript: 'typescript',
  tsx: 'tsx',
  typescriptreact: 'tsx',
  css: 'css',
  scss: 'scss',
  less: 'less',
  postcss: 'postcss',
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'mdx'
}
export const languageServiceLanguageIds: Record<string, string> = {
  html: 'html',
  'angular-html': 'html',
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'javascriptreact',
  javascriptreact: 'javascriptreact',
  ts: 'typescript',
  typescript: 'typescript',
  tsx: 'typescriptreact',
  typescriptreact: 'typescriptreact',
  css: 'css',
  scss: 'scss',
  less: 'less',
  postcss: 'postcss',
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'mdx'
}
const masterCSSClassListLanguageIds = new Set(['mcss', 'master-css'])
export const cssDirectiveLanguageIds = new Set(['css', 'scss', 'less', 'postcss'])
export const classAttributeValueWrappersKey = '__masterCSSClassAttributeValueWrappers'
const masterCSSShikiSupportedLanguageIds = new Set([
  ...Object.keys(shikiLanguageIds),
  ...Object.values(shikiLanguageIds)
])

export function isMasterCSSClassListLanguage(lang?: string) {
  return Boolean(lang && masterCSSClassListLanguageIds.has(lang))
}

export function getMasterCSSShikiLanguageId(lang?: string) {
  if (!lang) return
  return shikiLanguageIds[lang] ?? lang
}

export function isMasterCSSShikiSupportedLanguage(lang?: string) {
  const languageId = getMasterCSSShikiLanguageId(lang)
  return Boolean(languageId && masterCSSShikiSupportedLanguageIds.has(languageId))
}

export function getLanguageServiceLanguageId(lang?: string) {
  const languageId = lang ? languageServiceLanguageIds[lang] ?? lang : undefined
  return languageId
}

