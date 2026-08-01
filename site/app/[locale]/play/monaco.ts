import type { editor } from 'monaco-editor'
import { loader, type Monaco } from '@monaco-editor/react'
import { getThemeVariables } from '~/site/utils/theme-variables'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import masterCSSTextMateGrammar from '@master/css-language-service/syntaxes/master-css.tmLanguage.json' with { type: 'json' }

const jsdelivrNPMBaseURL = 'https://cdn.jsdelivr.net/npm/'
const monacoVSBaseURL = `${jsdelivrNPMBaseURL}monaco-editor@0.55.1/min/vs`
const shikiVersion = '4.2.0'
export const playMonacoThemes = {
  dark: 'dracula',
  light: 'min-light'
}
const playShikiLanguageModulePaths = [
  'html',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'css',
  'scss',
  'json',
  'vue',
  'svelte',
  'astro',
  'markdown',
  'mdx',
  'bash',
  'angular-html'
].map((languageId) => `@shikijs/langs@${shikiVersion}/${languageId}/+esm`)
const playShikiThemeModulePaths = [
  playMonacoThemes.dark,
  playMonacoThemes.light
].map((themeId) => `@shikijs/themes@${shikiVersion}/${themeId}/+esm`)

if (typeof window !== 'undefined') {
  loader.config({
    paths: {
      vs: monacoVSBaseURL,
    }
  })
}

const monoFallbackFont = getThemeVariables('font-family').find(({ key }) => key === 'mono-fallback')?.value

export const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  readOnly: false,
  minimap: {
    enabled: false,
  },
  padding: {
    top: 20,
    bottom: 20,
  },
  scrollBeyondLastLine: false,
  wrappingStrategy: 'advanced',
  overviewRulerLanes: 0,
  lineHeight: 22,
  fontSize: 13,
  fontFamily: typeof monoFallbackFont === 'string' ? monoFallbackFont : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  'semanticHighlighting.enabled': true
}

const editorHTMLOptions: any = {
  format: {
    wrapLineLength: 0
  }
}

const playMonacoLanguageIds = ['html', 'css']
const playMonacoLanguageIdSet = new Set(playMonacoLanguageIds)
const playCSSDiagnosticClearDelays = [250, 1000]
const masterCSSShikiLanguage = {
  ...(masterCSSTextMateGrammar as Record<string, unknown>),
  injectTo: [
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
  ]
}
type PlayHighlighter = {
  getLoadedThemes(): string[]
  getTheme(themeName: string): unknown
  setTheme(themeName: string): { colorMap: unknown[] }
}
type PlayShikiRuntime = {
  highlighter: PlayHighlighter
  shikiToMonaco(highlighter: PlayHighlighter, monaco: Monaco): void
  textmateThemeToMonacoTheme(theme: unknown): editor.IStandaloneThemeData
}
type PlayShikiCoreModule = {
  createHighlighterCore(options: {
    langs: unknown[]
    themes: unknown[]
    engine: unknown
  }): Promise<PlayHighlighter>
}
type PlayShikiEngineModule = {
  createJavaScriptRegexEngine(): unknown
}
type PlayShikiMonacoModule = {
  shikiToMonaco: PlayShikiRuntime['shikiToMonaco']
  textmateThemeToMonacoTheme: PlayShikiRuntime['textmateThemeToMonacoTheme']
}
type PlayShikiDefaultModule = {
  default: unknown
}
type PlayCompilerModule = {
  compilePlayCSS(sourceCSS: string, classes: string[]): Promise<{
    css: string
    manifest: MasterCSSManifest
    warnings: string[]
    result: unknown
  }>
}
declare global {
  interface Window {
    __masterCSSPlayCompiler?: PlayCompilerModule
    __masterCSSPlayCompilerResolve?: (module: PlayCompilerModule) => void
  }
}
let compilerPromise: Promise<PlayCompilerModule> | undefined
let playShikiRuntimePromise: Promise<PlayShikiRuntime> | undefined
// shikiToMonaco installs global Monaco providers and patches setTheme without
// returning disposables. Keep one highlighter alive for those closures.
const shikiMonacoRegistrations = new WeakMap<Monaco, Promise<PlayShikiRuntime>>()
const shikiMonacoLanguageRefreshes = new WeakSet<Monaco>()

function importPlayCDNModule<T>(path: string) {
  const url = `${jsdelivrNPMBaseURL}${path}`
  return import(/* webpackIgnore: true */ url) as Promise<T>
}

export function loadCompiler() {
  if (window.__masterCSSPlayCompiler) return Promise.resolve(window.__masterCSSPlayCompiler)
  compilerPromise ??= new Promise((resolve, reject) => {
    window.__masterCSSPlayCompilerResolve = resolve
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-play-compiler]')
    if (existingScript) return
    const script = document.createElement('script')
    script.type = 'module'
    script.async = true
    script.src = '/play-compiler/compiler.js'
    script.dataset.playCompiler = 'true'
    script.onerror = () => reject(new Error('Failed to load Play compiler'))
    document.head.append(script)
  })
  return compilerPromise
}

function flattenPlayShikiDefaultModules(modules: PlayShikiDefaultModule[]) {
  return modules.flatMap((module) => Array.isArray(module.default) ? module.default : [module.default])
}

async function createPlayShikiRuntime(): Promise<PlayShikiRuntime> {
  const [
    coreModule,
    engineModule,
    monacoModule,
    ...defaultModules
  ] = await Promise.all([
    importPlayCDNModule<PlayShikiCoreModule>(`shiki@${shikiVersion}/core/+esm`),
    importPlayCDNModule<PlayShikiEngineModule>(`shiki@${shikiVersion}/engine/javascript/+esm`),
    importPlayCDNModule<PlayShikiMonacoModule>(`@shikijs/monaco@${shikiVersion}/+esm`),
    ...playShikiLanguageModulePaths.map((path) => importPlayCDNModule<PlayShikiDefaultModule>(path)),
    ...playShikiThemeModulePaths.map((path) => importPlayCDNModule<PlayShikiDefaultModule>(path))
  ])
  const languageModules = defaultModules.slice(0, playShikiLanguageModulePaths.length)
  const themeModules = defaultModules.slice(playShikiLanguageModulePaths.length)
  const highlighter = await coreModule.createHighlighterCore({
    langs: [
      ...flattenPlayShikiDefaultModules(languageModules),
      masterCSSShikiLanguage
    ],
    themes: flattenPlayShikiDefaultModules(themeModules),
    engine: engineModule.createJavaScriptRegexEngine(),
  })

  return {
    highlighter,
    shikiToMonaco: monacoModule.shikiToMonaco,
    textmateThemeToMonacoTheme: monacoModule.textmateThemeToMonacoTheme
  }
}

function loadPlayShikiRuntime() {
  playShikiRuntimePromise ??= createPlayShikiRuntime()
  return playShikiRuntimePromise
}

function getThemeRuleForeground(theme: editor.IStandaloneThemeData, candidates: string[], fallback?: string) {
  const rules = [...theme.rules].reverse()
  for (const candidate of candidates) {
    const foreground = rules.find((rule) => rule.token === candidate && rule.foreground)?.foreground
    if (foreground) return foreground
  }
  for (const candidate of candidates) {
    const foreground = rules.find((rule) => rule.foreground && rule.token.includes(candidate))?.foreground
    if (foreground) return foreground
  }
  return fallback?.replace(/^#/, '')
}

function createMasterCSSSemanticTokenRules(theme: editor.IStandaloneThemeData): editor.ITokenThemeRule[] {
  const fallback = theme.colors['editor.foreground']?.replace(/^#/, '') || '212121'
  const string = getThemeRuleForeground(theme, ['string'], fallback)
  const value = getThemeRuleForeground(theme, ['entity.name.tag', 'string.quoted'], string)
  const property = getThemeRuleForeground(theme, ['meta.property-name', 'support.type.property-name', 'constant.numeric'], fallback)
  const keyword = getThemeRuleForeground(theme, ['keyword'], property)
  const variable = getThemeRuleForeground(theme, ['variable', 'meta.property-name', 'support.variable'], property)
  const fn = getThemeRuleForeground(theme, ['support.function', 'entity.name.function', 'entity.other.attribute-name'], variable)
  const selector = getThemeRuleForeground(theme, ['entity.name.class', 'entity.other.attribute-name', 'entity.name.type.class'], fn)
  const operator = getThemeRuleForeground(theme, ['keyword.operator', 'punctuation.separator'], fallback)
  const punctuation = getThemeRuleForeground(theme, ['punctuation'], operator)
  const blockBrace = getThemeRuleForeground(theme, ['punctuation.section.property-list', 'punctuation.section'], punctuation)
  const declarationSeparator = getThemeRuleForeground(theme, ['punctuation.separator.key-value', 'punctuation.separator'], punctuation)
  const declarationTerminator = getThemeRuleForeground(theme, ['punctuation.terminator.rule', 'punctuation.terminator'], punctuation)
  const functionPunctuation = getThemeRuleForeground(theme, ['punctuation.section.function', 'punctuation.section'], punctuation)
  const listSeparator = getThemeRuleForeground(theme, ['punctuation.separator.list', 'punctuation.separator'], punctuation)
  const queryOperator = getThemeRuleForeground(theme, ['keyword.operator.comparison', 'keyword.operator'], operator)
  const queryPunctuation = getThemeRuleForeground(theme, ['punctuation.separator.key-value', 'punctuation.definition.parameters', 'punctuation.section'], punctuation)
  const selectorCombinator = getThemeRuleForeground(theme, ['keyword.operator.combinator'], operator)
  const selectorDelimiter = getThemeRuleForeground(theme, ['punctuation.definition.entity'], selector)
  const important = getThemeRuleForeground(theme, ['keyword.other.important', 'keyword.operator.important', 'keyword'], keyword)
  const normal = 'normal'

  return [
    { token: 'class', foreground: value, fontStyle: normal },
    { token: 'class.declaration', foreground: selector, fontStyle: normal },
    { token: 'class.component', foreground: selector, fontStyle: normal },
    { token: 'class.declaration.component', foreground: selector, fontStyle: normal },
    { token: 'enumMember', foreground: value, fontStyle: normal },
    { token: 'enumMember.directive', foreground: variable, fontStyle: normal },
    { token: 'function', foreground: fn, fontStyle: normal },
    { token: 'keyword', foreground: keyword, fontStyle: normal },
    { token: 'keyword.directive', foreground: keyword, fontStyle: normal },
    { token: 'keyword.query', foreground: keyword, fontStyle: normal },
    { token: 'modifier', foreground: selector, fontStyle: normal },
    { token: 'modifier.directive', foreground: keyword, fontStyle: normal },
    { token: 'modifier.pseudoClass', foreground: selector, fontStyle: normal },
    { token: 'modifier.pseudoElement', foreground: selector, fontStyle: normal },
    { token: 'number', foreground: property, fontStyle: normal },
    { token: 'number.unit', foreground: property, fontStyle: normal },
    { token: 'operator', foreground: operator, fontStyle: normal },
    { token: 'operator.blockBrace', foreground: blockBrace, fontStyle: normal },
    { token: 'operator.declarationSeparator', foreground: declarationSeparator, fontStyle: normal },
    { token: 'operator.declarationTerminator', foreground: declarationTerminator, fontStyle: normal },
    { token: 'operator.directive', foreground: operator, fontStyle: normal },
    { token: 'operator.directiveTerminator', foreground: declarationTerminator, fontStyle: normal },
    { token: 'operator.functionPunctuation', foreground: functionPunctuation, fontStyle: normal },
    { token: 'operator.important', foreground: important, fontStyle: normal },
    { token: 'operator.query', foreground: operator, fontStyle: normal },
    { token: 'operator.queryOperator', foreground: queryOperator, fontStyle: normal },
    { token: 'operator.queryPunctuation', foreground: queryPunctuation, fontStyle: normal },
    { token: 'operator.selector', foreground: selectorCombinator, fontStyle: normal },
    { token: 'operator.selectorCombinator', foreground: selectorCombinator, fontStyle: normal },
    { token: 'operator.selectorPunctuation', foreground: listSeparator, fontStyle: normal },
    { token: 'operator.pseudoClassDelimiter', foreground: selectorDelimiter, fontStyle: normal },
    { token: 'operator.pseudoElementDelimiter', foreground: selectorDelimiter, fontStyle: normal },
    { token: 'operator.valueOperator', foreground: operator, fontStyle: normal },
    { token: 'operator.valueSeparator', foreground: listSeparator, fontStyle: normal },
    { token: 'property', foreground: property, fontStyle: normal },
    { token: 'string', foreground: string, fontStyle: normal },
    { token: 'string.quoted', foreground: string, fontStyle: normal },
    { token: 'type', foreground: value, fontStyle: normal },
    { token: 'type.selector', foreground: value, fontStyle: normal },
    { token: 'variable', foreground: variable, fontStyle: normal },
    { token: 'variable.selector', foreground: selector, fontStyle: normal }
  ]
}

function defineMasterCSSMonacoThemes(runtime: PlayShikiRuntime, monaco: Monaco) {
  const { highlighter, textmateThemeToMonacoTheme } = runtime
  for (const themeName of highlighter.getLoadedThemes()) {
    const theme = textmateThemeToMonacoTheme(highlighter.getTheme(themeName)) as unknown as editor.IStandaloneThemeData
    monaco.editor.defineTheme(themeName, {
      ...theme,
      rules: [
        ...theme.rules,
        ...createMasterCSSSemanticTokenRules(theme)
      ]
    })
  }
}

function registerPlayMonacoLanguages(monaco: Monaco) {
  const registeredLanguageIds = new Set(monaco.languages.getLanguages().map((language: { id: string }) => language.id))
  for (const id of playMonacoLanguageIds) {
    if (!registeredLanguageIds.has(id)) {
      monaco.languages.register({ id })
    }
  }
}

export function preparePlayMonaco(monaco: Monaco) {
  registerPlayMonacoLanguages(monaco)
  monaco.languages.html.htmlDefaults.setOptions(editorHTMLOptions)
  // Master CSS directives are valid in Play, but Monaco's CSS grammar reports them as native CSS errors.
  monaco.languages.css.cssDefaults.setOptions({
    ...monaco.languages.css.cssDefaults.options,
    validate: false
  })
  monaco.languages.css.cssDefaults.setModeConfiguration({
    ...monaco.languages.css.cssDefaults.modeConfiguration,
    diagnostics: false
  })
  scheduleClearPlayCSSDiagnostics(monaco)
}

function clearPlayCSSDiagnostics(monaco: Monaco) {
  for (const model of monaco.editor.getModels()) {
    if (model.getLanguageId() === 'css') {
      monaco.editor.setModelMarkers(model, 'css', [])
    }
  }
}

function scheduleClearPlayCSSDiagnostics(monaco: Monaco) {
  clearPlayCSSDiagnostics(monaco)
  for (const delay of playCSSDiagnosticClearDelays) {
    setTimeout(() => clearPlayCSSDiagnostics(monaco), delay)
  }
}

function installMonacoShiki(runtime: PlayShikiRuntime, monaco: Monaco) {
  registerPlayMonacoLanguages(monaco)
  runtime.shikiToMonaco(runtime.highlighter, monaco)
  defineMasterCSSMonacoThemes(runtime, monaco)
}

export async function registerMonacoShiki(monaco: Monaco) {
  let registration = shikiMonacoRegistrations.get(monaco)
  if (!registration) {
    registration = loadPlayShikiRuntime().then((runtime) => {
      installMonacoShiki(runtime, monaco)
      return runtime
    })
    shikiMonacoRegistrations.set(monaco, registration)
  }
  return await registration
}

export function refreshMonacoHighlighting(monaco: Monaco) {
  for (const model of monaco.editor.getModels()) {
    const languageId = model.getLanguageId()
    if (playMonacoLanguageIdSet.has(languageId)) {
      monaco.editor.setModelLanguage(model, languageId)
    }
  }
  scheduleClearPlayCSSDiagnostics(monaco)
}

export function scheduleMonacoShikiLanguageRefresh(runtime: PlayShikiRuntime, monaco: Monaco, getThemeName: () => string) {
  if (shikiMonacoLanguageRefreshes.has(monaco)) return
  shikiMonacoLanguageRefreshes.add(monaco)
  setTimeout(() => {
    // Monaco's bundled language contributions can attach after the first
    // editor mount and replace the Shiki token provider.
    installMonacoShiki(runtime, monaco)
    refreshMonacoHighlighting(monaco)
    monaco.editor.setTheme(getThemeName())
    scheduleClearPlayCSSDiagnostics(monaco)
  }, 250)
}

