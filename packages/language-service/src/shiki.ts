import masterCSSTextMateGrammar from '../syntaxes/master-css.tmLanguage.json' with { type: 'json' }
import type {
  HighlightTokenRole,
  MasterCSSLanguageClassPosition,
  SemanticTokenItem,
  SemanticTokenModifier,
  SemanticTokenType
} from '@master/css-tooling/language'
import {
  getMasterCSSSemanticTokenScopeKeys,
  MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP
} from '@master/css-tooling/language'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { createToolingSessionSync } from '@master/css-tooling/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSLanguageServiceSettings } from './settings'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export const MASTER_CSS_SHIKI_SCOPE_NAME = 'master-css.directive.injection'
export const MASTER_CSS_SHIKI_INJECT_TO = [
  'source.css',
  'source.css.scss',
  'source.css.less',
  'source.css.postcss'
] as const

export interface MasterCSSTextMateGrammar {
  name: string
  scopeName: string
  injectionSelector: string
  patterns: any[]
  repository: Record<string, any>
  [key: string]: any
}

export const MASTER_CSS_TEXTMATE_GRAMMAR = masterCSSTextMateGrammar as MasterCSSTextMateGrammar

export function createMasterCSSShikiLanguageRegistration(): MasterCSSTextMateGrammar & { injectTo: string[] } {
  return {
    ...MASTER_CSS_TEXTMATE_GRAMMAR,
    injectTo: [...MASTER_CSS_SHIKI_INJECT_TO]
  }
}

export const masterCSSShikiLanguage = createMasterCSSShikiLanguageRegistration()
const masterCSSShikiLanguages = [masterCSSShikiLanguage]

export default masterCSSShikiLanguages

export type MasterCSSShikiSemanticTokenStyleKey = SemanticTokenType | `${SemanticTokenType}.${SemanticTokenModifier}`
export type MasterCSSShikiHighlightRoleStyleKey = HighlightTokenRole
export type MasterCSSShikiSemanticTokenStyle = string | Record<string, string>
export type MasterCSSShikiSemanticTokenStyles = Partial<Record<MasterCSSShikiSemanticTokenStyleKey, MasterCSSShikiSemanticTokenStyle>>
export type MasterCSSShikiHighlightRoleStyles = Partial<Record<MasterCSSShikiHighlightRoleStyleKey, MasterCSSShikiSemanticTokenStyle>>
interface ShikiToken {
  content: string
  offset: number
  color?: string
  htmlStyle?: Record<string, string>
  htmlAttrs?: Record<string, unknown>
  explanation?: {
    scopes?: {
      scopeName: string
    }[]
  }[]
  [key: string]: unknown
}

interface ShikiPosition {
  line: number
  character: number
}

interface ShikiDecoration {
  start: number | ShikiPosition
  end: number | ShikiPosition
  tagName?: string
  properties?: Record<string, unknown>
  alwaysWrap?: boolean
  transform?: (element: unknown, type: 'wrapper' | 'line' | 'token') => unknown | undefined
}

interface ShikiCodeToHastOptions {
  lang?: string
  decorations?: ShikiDecoration[]
  includeExplanation?: 'scopeName' | boolean
  [key: string]: unknown
}

interface ShikiCodeToTokensResult {
  tokens: ShikiToken[][]
}

interface ShikiTransformerContext {
  source: string
  options: ShikiCodeToHastOptions
  codeToTokens?: (code: string, options: ShikiCodeToHastOptions) => ShikiCodeToTokensResult
}

interface ShikiTransformer {
  name: string
  enforce: 'post'
  tokens(this: ShikiTransformerContext, tokens: ShikiToken[][]): ShikiToken[][] | undefined
  root?(this: ShikiTransformerContext, root: unknown): unknown | undefined
}

export interface MasterCSSShikiDecoration extends Omit<ShikiDecoration, 'start' | 'end'> {
  start: number
  end: number
  type: SemanticTokenType
  role: HighlightTokenRole
  modifiers: SemanticTokenModifier[]
}

export interface MasterCSSShikiClassAttributeValueWrapperOptions {
  tagName?: string
  properties?: Record<string, unknown>
  transform?: ShikiDecoration['transform']
}

export interface MasterCSSShikiOptions {
  /**
   * Reuse an existing Master CSS instance when the caller already owns a
   * configured language engine.
   */
  session?: MasterCSSToolingSession
  /**
   * Class-position and manifest settings used when collecting embedded utilities.
   */
  settings?: MasterCSSLanguageServiceSettings
  /**
   * Convenience shortcut for `settings.manifest`.
   */
  manifest?: MasterCSSManifest
  /**
   * Shiki language id. Defaults to the `lang` passed to Shiki.
   */
  lang?: string
  /**
   * Treat the whole source as a whitespace-separated Master CSS class list.
   * This replaces the old standalone `.mcss` TextMate grammar use case
   * without contributing a Master CSS language.
   */
  classList?: boolean
  /**
   * Class prefix added to every semantic decoration.
   *
   * @default 'mcss-semantic'
   */
  classPrefix?: string
  /**
   * Add `data-semantic-token-*` attributes to decorated spans.
   *
   * @default true
   */
  dataAttributes?: boolean
  /**
   * Force Shiki to wrap semantic tokens instead of reusing the existing
   * TextMate token span when possible.
   */
  alwaysWrap?: boolean
  /**
   * Wrap each embedded class attribute/string value with its original host
   * language token presentation while keeping Master CSS semantic spans nested
   * inside it.
   *
   * @default true
   */
  classAttributeValueWrapper?: boolean | MasterCSSShikiClassAttributeValueWrapperOptions
  /**
   * Inline styles applied by semantic token type or type.modifier. These
   * styles intentionally replace the underlying TextMate token style for the
   * decorated range, which keeps tokens such as `block` and `block:hover`
   * visually aligned when they share the same semantic type.
   */
  semanticTokenStyles?: MasterCSSShikiSemanticTokenStyles
  /**
   * Inline styles applied by CSS-native highlight role. Role styles are the
   * most precise presentation override and are shared across host languages.
   */
  highlightRoleStyles?: MasterCSSShikiHighlightRoleStyles
  /**
   * Resolve Master CSS semantic token scopes through the active Shiki
   * theme when possible. When disabled, the transformer only splits tokens
   * and attaches semantic metadata/classes unless explicit semantic styles
   * are provided.
   *
   * @default true
   */
  matchCSSSyntaxStyles?: boolean
}

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
const languageServiceLanguageIds: Record<string, string> = {
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
const cssDirectiveLanguageIds = new Set(['css', 'scss', 'less', 'postcss'])
const classAttributeValueWrappersKey = '__masterCSSClassAttributeValueWrappers'
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

function getLanguageServiceLanguageId(lang?: string) {
  const languageId = lang ? languageServiceLanguageIds[lang] ?? lang : undefined
  return languageId
}

function createShikiSession(options: MasterCSSShikiOptions) {
  return options.session || createToolingSessionSync({
    manifest: options.manifest ?? options.settings?.manifest ?? defaultManifest
  })
}

function stringifyStyle(style: MasterCSSShikiSemanticTokenStyle) {
  if (typeof style === 'string') return style
  return Object.entries(style)
    .map(([property, value]) => `${property}:${value}`)
    .join(';')
}

function resolveSemanticTokenStyle(
  type: SemanticTokenType,
  modifiers: SemanticTokenModifier[],
  styles?: MasterCSSShikiSemanticTokenStyles
) {
  if (!styles) return
  const matchedStyles = [
    styles[type],
    ...modifiers.map((modifier) => styles[`${type}.${modifier}` as MasterCSSShikiSemanticTokenStyleKey])
  ].filter((style): style is MasterCSSShikiSemanticTokenStyle => Boolean(style))
  if (!matchedStyles.length) return
  return matchedStyles.map(stringifyStyle).join(';')
}

function resolveHighlightTokenStyle(
  item: Pick<SemanticTokenItem, 'type' | 'modifiers'> & { role: HighlightTokenRole },
  options: MasterCSSShikiOptions
) {
  const roleStyle = options.highlightRoleStyles?.[item.role]
  if (roleStyle) return stringifyStyle(roleStyle)
  return resolveSemanticTokenStyle(item.type, item.modifiers ?? [], options.semanticTokenStyles)
}

function splitToken(token: ShikiToken, breakpoints: number[]) {
  const tokens: ShikiToken[] = []
  let lastOffset = 0
  for (const offset of breakpoints) {
    if (offset > lastOffset) {
      tokens.push({
        ...token,
        content: token.content.slice(lastOffset, offset),
        offset: token.offset + lastOffset
      })
    }
    lastOffset = offset
  }
  if (lastOffset < token.content.length) {
    tokens.push({
      ...token,
      content: token.content.slice(lastOffset),
      offset: token.offset + lastOffset
    })
  }
  return tokens
}

function splitTokensAtOffsets(tokens: ShikiToken[][], breakpoints: number[]) {
  const sortedBreakpoints = [...new Set(breakpoints)].sort((a, b) => a - b)
  if (!sortedBreakpoints.length) return tokens
  return tokens.map((line) => {
    return line.flatMap((token) => {
      const breakpointsInToken = sortedBreakpoints
        .filter((offset) => token.offset < offset && offset < token.offset + token.content.length)
        .map((offset) => offset - token.offset)
      return breakpointsInToken.length ? splitToken(token, breakpointsInToken) : token
    })
  })
}

function parseStyleProperty(style: unknown) {
  if (typeof style === 'string') {
    return Object.fromEntries(style
      .split(';')
      .map((declaration) => declaration.split(':'))
      .filter(([property, value]) => property && value)
      .map(([property, ...value]) => [property.trim(), value.join(':').trim()]))
  }
  if (style && typeof style === 'object' && !Array.isArray(style)) {
    return Object.fromEntries(Object
      .entries(style)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
  }
}

function resolveClassNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(resolveClassNames)
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : []
}

function mergeClassProperty(current: unknown, next: unknown) {
  return [
    ...resolveClassNames(current),
    ...resolveClassNames(next)
  ].join(' ')
}

function applySemanticDecorationToToken(
  token: ShikiToken,
  decorations: MasterCSSShikiDecoration[],
  resolveSyntaxStyle?: (token: ShikiToken, decoration: MasterCSSShikiDecoration, decorations: MasterCSSShikiDecoration[]) => Record<string, string> | undefined
) {
  const tokenStart = token.offset
  const tokenEnd = token.offset + token.content.length
  const matchedDecorations = decorations.filter(({ start, end }) => start <= tokenStart && tokenEnd <= end)
  if (!matchedDecorations.length) return token

  const htmlAttrs: Record<string, unknown> = { ...token.htmlAttrs }
  const htmlStyle: Record<string, string> = { ...token.htmlStyle }
  for (const decoration of matchedDecorations) {
    const properties = decoration.properties ?? {}
    if (properties.class) {
      htmlAttrs.class = mergeClassProperty(htmlAttrs.class, properties.class)
    }
    const style = parseStyleProperty(properties.style)
    if (style) {
      for (const key of Object.keys(htmlStyle)) {
        delete htmlStyle[key]
      }
      Object.assign(htmlStyle, style)
    } else {
      const syntaxStyle = resolveSyntaxStyle?.(token, decoration, decorations)
      if (syntaxStyle) {
        for (const key of Object.keys(htmlStyle)) {
          delete htmlStyle[key]
        }
        Object.assign(htmlStyle, syntaxStyle)
      }
    }
    for (const [name, value] of Object.entries(properties)) {
      if (name === 'class' || name === 'style' || value === undefined) continue
      htmlAttrs[name] = typeof value === 'string' ? value : String(value)
    }
  }

  return {
    ...token,
    htmlAttrs,
    htmlStyle
  }
}

function cloneStyle(style: unknown) {
  return style && typeof style === 'object' && !Array.isArray(style)
    ? Object.fromEntries(Object
      .entries(style)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : undefined
}

function getTokenStyleObject(token: ShikiToken) {
  const htmlStyle = cloneStyle(token.htmlStyle)
  if (htmlStyle) return htmlStyle
  return typeof token.color === 'string' ? { color: token.color } : undefined
}

interface ScopeStyleEntry {
  scope: string
  normalizedScope: string
  style: Record<string, string>
}

const SEMANTIC_SCOPE_STYLE_PROBE = [
  '@theme light inline {',
  '  --token: var(--value);',
  '}',
  '@components {',
  '  btn { @compose block fg:red:hover@md; }',
  '}',
  '.x, div > li:hover::before {',
  '  color: red !important;',
  '  width: 1.5rem;',
  '  background: rgb(0 0 0 / .5);',
  '  content: "x";',
  '  --token: red;',
  '}',
  '@media (width >= 1px) { .y { color: var(--token); } }'
].join('\n')

function normalizeScope(scope: string) {
  let normalizedScope = scope
  while (normalizedScope.endsWith('.css') || normalizedScope.endsWith('.master-css')) {
    normalizedScope = normalizedScope
      .replace(/\.css$/, '')
      .replace(/\.master-css$/, '')
  }
  return normalizedScope
}

function getScopeCandidates(scope: string) {
  return [...new Set([
    scope,
    scope.replace(/\.css$/, ''),
    scope.replace(/\.master-css$/, ''),
    normalizeScope(scope)
  ])]
}

function getScopePrefixes(scope: string) {
  const prefixes: string[] = []
  const bases = [
    scope,
    scope.replace(/\.css$/, ''),
    scope.replace(/\.master-css$/, ''),
    normalizeScope(scope)
  ]
  for (const base of bases) {
    const segments = base.split('.')
    for (let length = segments.length; length >= 2; length--) {
      prefixes.push(segments.slice(0, length).join('.'))
    }
  }
  return [...new Set(prefixes)]
}

function collectScopeStyleEntries(tokens: ShikiToken[]): ScopeStyleEntry[] {
  const entries: ScopeStyleEntry[] = []
  const seenScopes = new Set<string>()
  for (const token of tokens) {
    const style = getTokenStyleObject(token)
    if (!style) continue
    for (const explanation of token.explanation ?? []) {
      for (const { scopeName } of explanation.scopes ?? []) {
        if (seenScopes.has(scopeName)) continue
        seenScopes.add(scopeName)
        entries.push({
          scope: scopeName,
          normalizedScope: normalizeScope(scopeName),
          style
        })
      }
    }
  }
  return entries
}

function findStyleByScope(entries: ScopeStyleEntry[], scope: string) {
  for (const candidate of getScopeCandidates(scope)) {
    const exact = entries.find((entry) => entry.scope === candidate || entry.normalizedScope === candidate)
    if (exact) return exact.style
  }
  for (const prefix of getScopePrefixes(scope)) {
    const prefixed = entries.find((entry) => (
      entry.scope === prefix
      || entry.normalizedScope === prefix
      || entry.scope.startsWith(`${prefix}.`)
      || entry.normalizedScope.startsWith(`${prefix}.`)
    ))
    if (prefixed) return prefixed.style
  }
}

function createSemanticScopeStyleResolver(
  context: ShikiTransformerContext,
  options: MasterCSSShikiOptions
) {
  if (options.matchCSSSyntaxStyles === false || typeof context.codeToTokens !== 'function') return
  try {
    const { lang: _lang, decorations: _decorations, transformers: _transformers, ...tokenOptions } = context.options
    const scopeStyleEntries = collectScopeStyleEntries(context.codeToTokens(SEMANTIC_SCOPE_STYLE_PROBE, {
      ...tokenOptions,
      lang: 'css',
      includeExplanation: 'scopeName'
    }).tokens.flat())

    return (_token: ShikiToken, decoration: MasterCSSShikiDecoration) => {
      for (const key of getMasterCSSSemanticTokenScopeKeys(decoration.type, decoration.modifiers)) {
        for (const scope of MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP[key]) {
          const style = findStyleByScope(scopeStyleEntries, scope)
          if (style) return style
        }
      }
    }
  } catch {
    return
  }
}

function createSemanticTokenDecorations(
  tokens: SemanticTokenItem[],
  options: MasterCSSShikiOptions
): MasterCSSShikiDecoration[] {
  const classPrefix = options.classPrefix ?? 'mcss-semantic'
  const includeDataAttributes = options.dataAttributes ?? true
  return tokens.map(({ start, end, type, modifiers: semanticModifiers = [], role: semanticRole }) => {
    const role = semanticRole ?? resolveHighlightRole({ type, modifiers: semanticModifiers })
    const modifiers = semanticModifiers.filter((modifier) =>
      modifier !== ROLE_TOKEN_MODIFIERS[role]
      && !(modifier === 'declaration' && type !== 'class')
    )
    const classNames = [
      classPrefix,
      `${classPrefix}-${type}`,
      `${classPrefix}-role-${role.replace(/\./g, '-')}`,
      ...modifiers.map((modifier) => `${classPrefix}-${type}-${modifier}`)
    ]
    const style = resolveHighlightTokenStyle({ type, role, modifiers }, options)
    return {
      start,
      end,
      type,
      role,
      modifiers,
      alwaysWrap: options.alwaysWrap,
      properties: {
        class: classNames,
        ...(style ? { style } : undefined),
        ...(includeDataAttributes
          ? {
            'data-semantic-token-type': type,
            'data-semantic-token-modifiers': modifiers.join(' '),
            'data-highlight-role': role
          }
          : undefined)
      }
    }
  })
}

function getClassAttributeValueWrapperOption(options: MasterCSSShikiOptions) {
  return options.classAttributeValueWrapper ?? true
}

function shouldCreateClassAttributeValueWrappers(options: MasterCSSShikiOptions) {
  const option = getClassAttributeValueWrapperOption(options)
  if (!option || options.classList) return false
  const lang = options.lang ? languageServiceLanguageIds[options.lang] ?? options.lang : undefined
  return Boolean(lang && !cssDirectiveLanguageIds.has(lang))
}

function getLineStartOffsets(source: string) {
  const offsets = [0]
  for (let index = 0; index < source.length; index++) {
    if (source[index] === '\n') offsets.push(index + 1)
  }
  return offsets
}

function resolvePositionOffset(source: string, lineStartOffsets: number[], position: number | ShikiPosition) {
  if (typeof position === 'number') {
    return position >= 0 && position <= source.length ? position : undefined
  }
  const lineStart = lineStartOffsets[position.line]
  if (lineStart === undefined) return
  const nextLineStart = lineStartOffsets[position.line + 1]
  const lineEnd = nextLineStart === undefined ? source.length : nextLineStart - 1
  let character = position.character
  if (character < 0) character = lineEnd - lineStart + character
  if (character < 0 || lineStart + character > lineEnd) return
  return lineStart + character
}

function resolveDecorationRange(source: string, lineStartOffsets: number[], decoration: ShikiDecoration) {
  const start = resolvePositionOffset(source, lineStartOffsets, decoration.start)
  const end = resolvePositionOffset(source, lineStartOffsets, decoration.end)
  return start === undefined || end === undefined ? undefined : { start, end }
}

function decorationsPartiallyIntersect(a: { start: number, end: number }, b: { start: number, end: number }) {
  const isAHasBStart = a.start <= b.start && b.start < a.end
  const isAHasBEnd = a.start < b.end && b.end <= a.end
  const isBHasAStart = b.start <= a.start && a.start < b.end
  const isBHasAEnd = b.start < a.end && a.end <= b.end
  if (!isAHasBStart && !isAHasBEnd && !isBHasAStart && !isBHasAEnd) return false
  if (isAHasBStart && isAHasBEnd) return false
  if (isBHasAStart && isBHasAEnd) return false
  if (isBHasAStart && a.start === a.end) return false
  if (isAHasBEnd && b.start === b.end) return false
  return true
}

function findTokenStyleForRange(tokens: ShikiToken[][], range: { start: number, end: number }) {
  for (const line of tokens) {
    for (const token of line) {
      const start = token.offset
      const end = token.offset + token.content.length
      if (end <= range.start || start >= range.end) continue
      if (!token.content.trim()) continue
      const style = getTokenStyleObject(token)
      if (style) return stringifyStyle(style)
    }
  }
}

function withoutUndefinedProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined))
}

function createClassAttributeValueWrapperDecorations(
  source: string,
  classPositions: readonly MasterCSSLanguageClassPosition[],
  tokens: ShikiToken[][],
  options: MasterCSSShikiOptions,
  existingDecorations: ShikiDecoration[] = []
): ShikiDecoration[] {
  if (!shouldCreateClassAttributeValueWrappers(options)) return []

  const contextRanges = new Map<string, { start: number, end: number }>()
  for (const { contextRange } of classPositions) {
    if (contextRange.start >= contextRange.end) continue
    contextRanges.set(`${contextRange.start}:${contextRange.end}`, contextRange)
  }
  if (!contextRanges.size) return []

  const lineStartOffsets = existingDecorations.length ? getLineStartOffsets(source) : []
  const existingRanges = existingDecorations
    .map((decoration) => resolveDecorationRange(source, lineStartOffsets, decoration))
    .filter((range): range is { start: number, end: number } => Boolean(range))
  const wrapperOption = getClassAttributeValueWrapperOption(options)
  const wrapperOptions = typeof wrapperOption === 'object' ? wrapperOption : undefined

  return [...contextRanges.values()]
    .filter((range) => !existingRanges.some((existingRange) => decorationsPartiallyIntersect(range, existingRange)))
    .map((range) => {
      const style = findTokenStyleForRange(tokens, range)
      const defaultProperties = {
        class: 'mcss-host mcss-host-role-class-attribute-value',
        'data-master-css-host-role': 'class-attribute-value',
        style
      }
      const customProperties = wrapperOptions?.properties ?? {}
      return {
        start: range.start,
        end: range.end,
        tagName: wrapperOptions?.tagName ?? 'span',
        alwaysWrap: true,
        transform: wrapperOptions?.transform,
        properties: {
          ...withoutUndefinedProperties(defaultProperties),
          ...withoutUndefinedProperties(customProperties),
          class: mergeClassProperty(defaultProperties.class, customProperties.class)
        }
      }
    })
}

interface HastText {
  type: 'text'
  value: string
}

interface HastElement {
  type: 'element'
  tagName: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

type HastNode = HastElement | HastText

function isHastElement(node: unknown): node is HastElement {
  return Boolean(node && typeof node === 'object' && (node as HastElement).type === 'element')
}

function getHastText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  if ((node as HastText).type === 'text') return (node as HastText).value
  if (!isHastElement(node)) return ''
  return (node.children ?? []).map(getHastText).join('')
}

function hasHastClass(element: HastElement, className: string) {
  return resolveClassNames(element.properties?.class).includes(className)
}

function collectCodeElements(node: unknown, codeElements: HastElement[] = []) {
  if (isHastElement(node) && node.tagName === 'code') codeElements.push(node)
  const children = node && typeof node === 'object' && Array.isArray((node as { children?: unknown[] }).children)
    ? (node as { children: unknown[] }).children
    : []
  for (const child of children) collectCodeElements(child, codeElements)
  return codeElements
}

function createSourceLineRanges(source: string) {
  const ranges: { start: number, end: number }[] = []
  let start = 0
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== '\n') continue
    ranges.push({ start, end: index })
    start = index + 1
  }
  ranges.push({ start, end: source.length })
  return ranges
}

function createHastText(value: string): HastText | undefined {
  return value ? { type: 'text', value } : undefined
}

function cloneHastElement(element: HastElement, children: HastNode[]) {
  return {
    ...element,
    properties: element.properties ? { ...element.properties } : undefined,
    children
  }
}

function pushHastNode(target: HastNode[], node: HastNode | undefined) {
  if (node) target.push(node)
}

function pushHastElementSlice(target: HastNode[], element: HastElement, children: HastNode[]) {
  if (children.length) target.push(cloneHastElement(element, children))
}

function splitHastNodeByRange(node: HastNode, nodeStart: number, start: number, end: number) {
  const before: HastNode[] = []
  const inside: HastNode[] = []
  const after: HastNode[] = []
  const nodeTextLength = getHastText(node).length
  const nodeEnd = nodeStart + nodeTextLength

  if (nodeEnd <= start) {
    before.push(node)
    return { before, inside, after, length: nodeTextLength }
  }
  if (nodeStart >= end) {
    after.push(node)
    return { before, inside, after, length: nodeTextLength }
  }
  if (node.type === 'text') {
    const localStart = Math.max(0, start - nodeStart)
    const localEnd = Math.min(node.value.length, end - nodeStart)
    pushHastNode(before, createHastText(node.value.slice(0, localStart)))
    pushHastNode(inside, createHastText(node.value.slice(localStart, localEnd)))
    pushHastNode(after, createHastText(node.value.slice(localEnd)))
    return { before, inside, after, length: nodeTextLength }
  }
  if (start <= nodeStart && nodeEnd <= end) {
    inside.push(node)
    return { before, inside, after, length: nodeTextLength }
  }

  const splitChildren = splitHastNodesByRange(
    node.children ?? [],
    Math.max(0, start - nodeStart),
    Math.min(nodeTextLength, end - nodeStart)
  )
  pushHastElementSlice(before, node, splitChildren.before)
  pushHastElementSlice(inside, node, splitChildren.inside)
  pushHastElementSlice(after, node, splitChildren.after)
  return { before, inside, after, length: nodeTextLength }
}

function splitHastNodesByRange(nodes: HastNode[], start: number, end: number) {
  const before: HastNode[] = []
  const inside: HastNode[] = []
  const after: HastNode[] = []
  let offset = 0

  for (const node of nodes) {
    const splitNode = splitHastNodeByRange(node, offset, start, end)
    before.push(...splitNode.before)
    inside.push(...splitNode.inside)
    after.push(...splitNode.after)
    offset += splitNode.length
  }
  return { before, inside, after }
}

function applyClassAttributeValueWrapperToLine(line: HastElement, start: number, end: number, decoration: ShikiDecoration) {
  const splitChildren = splitHastNodesByRange(line.children ?? [], start, end)
  if (!splitChildren.inside.length) return
  const wrapper: HastElement = {
    type: 'element',
    tagName: decoration.tagName ?? 'span',
    properties: { ...(decoration.properties ?? {}) },
    children: splitChildren.inside
  }
  const transformedWrapper = decoration.transform?.(wrapper, 'wrapper')
  line.children = [
    ...splitChildren.before,
    isHastElement(transformedWrapper) ? transformedWrapper : wrapper,
    ...splitChildren.after
  ]
}

function applyClassAttributeValueWrappers(root: unknown, source: string, decorations: ShikiDecoration[]) {
  if (!decorations.length) return
  const sourceLineRanges = createSourceLineRanges(source)
  const codeElements = collectCodeElements(root)
  for (const codeElement of codeElements) {
    const lines = (codeElement.children ?? [])
      .filter((child): child is HastElement => isHastElement(child) && hasHastClass(child, 'line'))
    for (const decoration of decorations) {
      const { start, end } = decoration
      if (typeof start !== 'number' || typeof end !== 'number') continue
      const startLine = sourceLineRanges.findIndex((range) => range.start <= start && start <= range.end)
      const endLine = sourceLineRanges.findIndex((range) => range.start <= end && end <= range.end)
      if (startLine < 0 || startLine !== endLine) continue
      const line = lines[startLine]
      if (!line) continue
      const lineRange = sourceLineRanges[startLine]
      applyClassAttributeValueWrapperToLine(
        line,
        start - lineRange.start,
        end - lineRange.start,
        decoration
      )
    }
  }
}

const ROLE_TOKEN_MODIFIERS: Partial<Record<HighlightTokenRole, SemanticTokenModifier>> = {
  'block.brace': 'blockBrace',
  'declaration.separator': 'declarationSeparator',
  'declaration.terminator': 'declarationTerminator',
  'selector.combinator': 'selectorCombinator',
  'selector.punctuation': 'selectorPunctuation',
  'selector.pseudoClass.delimiter': 'pseudoClassDelimiter',
  'selector.pseudoElement.delimiter': 'pseudoElementDelimiter'
}

function resolveHighlightRole({
  type,
  modifiers = []
}: Pick<SemanticTokenItem, 'type' | 'modifiers'>): HighlightTokenRole {
  const modifierSet = new Set(modifiers)
  if (modifierSet.has('blockBrace')) return 'block.brace'
  if (modifierSet.has('declarationSeparator')) return 'declaration.separator'
  if (modifierSet.has('declarationTerminator')) return 'declaration.terminator'
  if (modifierSet.has('selectorCombinator')) return 'selector.combinator'
  if (modifierSet.has('selectorPunctuation')) return 'selector.punctuation'
  if (modifierSet.has('pseudoClassDelimiter')) return 'selector.pseudoClass.delimiter'
  if (modifierSet.has('pseudoElementDelimiter')) return 'selector.pseudoElement.delimiter'
  if (modifierSet.has('pseudoClass')) return 'selector.pseudoClass.name'
  if (modifierSet.has('pseudoElement')) return 'selector.pseudoElement.name'
  if (modifierSet.has('important')) return 'value.important'
  if (modifierSet.has('query')) return 'query.keyword'
  if (type === 'property') return 'declaration.property'
  if (type === 'type') return 'selector.type'
  if (modifierSet.has('component')) return 'utility.component'
  if (modifierSet.has('declaration')) return 'utility.semantic'
  if (type === 'number') return 'value.number'
  if (type === 'variable') return 'value.variable'
  return 'value.keyword'
}

export function createMasterCSSShikiDecorations(
  code: string,
  options: MasterCSSShikiOptions = {}
): MasterCSSShikiDecoration[] {
  const analysis = analyzeMasterCSSShikiDocument(code, options)
  return analysis?.semanticTokens.length
    ? createSemanticTokenDecorations(analysis.semanticTokens, options)
    : []
}

function analyzeMasterCSSShikiDocument(
  code: string,
  options: MasterCSSShikiOptions
): { classPositions: readonly MasterCSSLanguageClassPosition[], semanticTokens: SemanticTokenItem[] } | undefined {
  const classList = options.classList ?? isMasterCSSClassListLanguage(options.lang)
  const languageId = getLanguageServiceLanguageId(classList ? 'plaintext' : options.lang)
  if (!languageId) return
  const session = createShikiSession(options)
  try {
    const { classPositions, semanticTokens } = session.analyzeDocument({
      source: code,
      languageId,
      ...(options.settings
        ? {
            settings: {
              ...(options.settings.classAttributes ? { classAttributes: options.settings.classAttributes } : {}),
              ...(options.settings.classFunctions ? { classFunctions: options.settings.classFunctions } : {}),
              ...(options.settings.classDeclarations ? { classDeclarations: options.settings.classDeclarations } : {})
            }
          }
        : {})
    })
    return {
      classPositions: [...classPositions],
      semanticTokens: [...semanticTokens]
    }
  } finally {
    if (!options.session) session.dispose()
  }
}

export function transformerMasterCSS(
  options: MasterCSSShikiOptions = {}
): ShikiTransformer {
  return {
    name: 'master-css',
    enforce: 'post',
    tokens(this: ShikiTransformerContext, tokens) {
      const lang = options.lang ?? this.options.lang
      const classList = options.classList ?? isMasterCSSClassListLanguage(lang)
      const resolvedOptions = {
        ...options,
        lang,
        classList
      }
      const analysis = analyzeMasterCSSShikiDocument(this.source, resolvedOptions)
      const decorations = analysis?.semanticTokens.length
        ? createSemanticTokenDecorations(analysis.semanticTokens, resolvedOptions)
        : []
      const classAttributeValueWrapperDecorations = createClassAttributeValueWrapperDecorations(
        this.source,
        analysis?.classPositions ?? [],
        tokens,
        resolvedOptions,
        this.options.decorations ?? []
      )
      this.options[classAttributeValueWrappersKey] = classAttributeValueWrapperDecorations
      if (!decorations.length) return
      const tokensSplitAtSemanticBoundaries = splitTokensAtOffsets(tokens, decorations.flatMap(({ start, end }) => [start, end]))
      const resolveSyntaxStyle = createSemanticScopeStyleResolver(this, resolvedOptions)
      return tokensSplitAtSemanticBoundaries.map((line) => line.map((token) => applySemanticDecorationToToken(token, decorations, resolveSyntaxStyle)))
    },
    root(this: ShikiTransformerContext, root) {
      applyClassAttributeValueWrappers(
        root,
        this.source,
        (this.options[classAttributeValueWrappersKey] as ShikiDecoration[] | undefined) ?? []
      )
    }
  }
}
