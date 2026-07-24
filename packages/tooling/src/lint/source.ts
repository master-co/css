import type { MasterCSSSourceRange as SourceRange } from '@master/css-binding/tooling'
import {
  type MasterCSSCanonicalClassesReportOptions,
  type MasterCSSInvalidClassesReportOptions,
  type MasterCSSLintDiagnostic,
  type MasterCSSLintDiagnosticData,
  type MasterCSSLintDiagnosticSeverity,
  type MasterCSSLintFix,
  type MasterCSSLintRange,
  type MasterCSSLintRuleId,
  type MasterCSSUnapprovedRawValueClassesReportOptions
} from './diagnostics'
import type { MasterCSSToolingSession } from '../tooling-session'

const MAX_FIX_PASSES = 10

export const masterCSSLintRuleIds: readonly MasterCSSLintRuleId[] = Object.freeze([
  'sort-classes',
  'no-invalid-classes',
  'no-conflicting-classes',
  'prefer-canonical-classes',
  'no-unapproved-raw-values'
])

export const defaultMasterCSSLintRules: Readonly<Record<MasterCSSLintRuleId, boolean>> = Object.freeze({
  'sort-classes': true,
  'no-invalid-classes': true,
  'no-conflicting-classes': true,
  'prefer-canonical-classes': true,
  'no-unapproved-raw-values': false
})

export type MasterCSSLintFileSourceKind = 'source' | 'stylesheet' | 'manifest'
export type MasterCSSLintDiagnosticSourceKind = 'class-attribute' | 'class-expression' | 'compose-directive' | 'manifest'
export type MasterCSSLintSourceFixKind = 'class-list' | 'directive'
export type MasterCSSLintSourceFixSafety = 'safe' | 'structural'

export interface MasterCSSLintSourceLocation {
  line: number
  column: number
}

export interface MasterCSSLintSourceLocationRange {
  start: MasterCSSLintSourceLocation
  end: MasterCSSLintSourceLocation
}

export interface MasterCSSLintSourceFix {
  kind: MasterCSSLintSourceFixKind
  safety: MasterCSSLintSourceFixSafety
  range: MasterCSSLintRange
  text: string
  description: string
  requiresFormatting: boolean
}

export interface MasterCSSLintSourceDiagnostic {
  ruleId?: MasterCSSLintRuleId | 'manifest'
  code: string
  severity: MasterCSSLintDiagnosticSeverity
  message: string
  range: MasterCSSLintRange
  loc: MasterCSSLintSourceLocationRange
  source: 'Master CSS'
  sourceKind: MasterCSSLintDiagnosticSourceKind
  data?: MasterCSSLintDiagnosticData
  fixes?: MasterCSSLintSourceFix[]
}

export interface MasterCSSLintFileResult {
  filePath: string
  languageId: string
  sourceKind: MasterCSSLintFileSourceKind
  diagnostics: MasterCSSLintSourceDiagnostic[]
}

export interface MasterCSSLintSummary {
  files: number
  diagnostics: number
  errors: number
  warnings: number
  fixable: number
  safeFixes: number
  structuralFixes: number
}

export interface MasterCSSLintContentOptions {
  content: string
  filePath: string
  rules?: Partial<Record<MasterCSSLintRuleId, boolean>>
  ruleOptions?: MasterCSSLintContentRuleOptions
  severities?: Partial<Record<MasterCSSLintRuleId, MasterCSSLintDiagnosticSeverity>>
  lintSession: Pick<
    MasterCSSToolingSession,
    'analyzeLintClassList' | 'analyzeLintDocument' | 'tokenizeClassList'
  >
}

export interface MasterCSSFixContentOptions extends MasterCSSLintContentOptions {
  includeDirectiveFixes?: boolean
}

export interface MasterCSSLintContentRuleOptions {
  'no-invalid-classes'?: MasterCSSInvalidClassesReportOptions
  'prefer-canonical-classes'?: MasterCSSCanonicalClassesReportOptions
  'no-unapproved-raw-values'?: MasterCSSUnapprovedRawValueClassesReportOptions
}

interface ClassListContext {
  range: SourceRange
  text: string
  sourceKind: Exclude<MasterCSSLintDiagnosticSourceKind, 'manifest'>
  unescape?: string | false
  directive?: SourceRange
  classNames: string[]
}

const languageByExtension: Record<string, string> = {
  '.astro': 'astro',
  '.css': 'css',
  '.htm': 'html',
  '.html': 'html',
  '.js': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'javascriptreact',
  '.less': 'less',
  '.md': 'markdown',
  '.mdx': 'mdx',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.php': 'html',
  '.pug': 'html',
  '.scss': 'scss',
  '.svelte': 'svelte',
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.vue': 'vue'
}

const stylesheetLanguageIds = new Set(['css', 'scss', 'less'])

export function resolveMasterCSSLintRules(option: string | undefined): Record<MasterCSSLintRuleId, boolean> {
  if (!option) return { ...defaultMasterCSSLintRules }
  const resolved = Object.fromEntries(masterCSSLintRuleIds.map((ruleId) => [ruleId, false])) as Record<MasterCSSLintRuleId, boolean>
  for (const rule of option.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (rule === 'recommended') {
      Object.assign(resolved, defaultMasterCSSLintRules)
      continue
    }
    if (rule === 'all') {
      for (const ruleId of masterCSSLintRuleIds) resolved[ruleId] = true
      continue
    }
    if (!masterCSSLintRuleIds.includes(rule as MasterCSSLintRuleId)) {
      throw new Error(`Unknown Master CSS lint rule "${rule}".`)
    }
    resolved[rule as MasterCSSLintRuleId] = true
  }
  return resolved
}

function resolveRules(rules: Partial<Record<MasterCSSLintRuleId, boolean>> | undefined) {
  return {
    ...defaultMasterCSSLintRules,
    ...rules
  }
}

function getLanguageId(filePath: string) {
  const separator = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  const dot = filePath.lastIndexOf('.')
  const extension = dot > separator ? filePath.slice(dot).toLowerCase() : ''
  return languageByExtension[extension] || 'html'
}

function getFileSourceKind(languageId: string): MasterCSSLintFileSourceKind {
  return stylesheetLanguageIds.has(languageId) ? 'stylesheet' : 'source'
}

function detectClassListUnescape(content: string, range: SourceRange) {
  const quote = content[range.start - 1]
  return quote === '"' || quote === '\'' || quote === '`' ? quote : false
}

function findComposeDirective(content: string, range: SourceRange): SourceRange | undefined {
  const start = content.lastIndexOf('@compose', range.start)
  if (start === -1) return
  const semicolon = content.indexOf(';', range.end)
  if (semicolon === -1 || content.slice(start, range.start).includes('{')) return
  return { start, end: semicolon + 1 }
}

function inferClassSourceKind(content: string, range: SourceRange): Exclude<MasterCSSLintDiagnosticSourceKind, 'compose-directive' | 'manifest'> {
  const prefix = content.slice(Math.max(0, range.start - 80), range.start)
  return /(?:^|[\s{<])(?:class|className|class:list|:class|v-bind:class|\[class\]|\[className\]|\[ngClass\])\s*=\s*(?:"|'|`|\{[^]*$)/.test(prefix)
    ? 'class-attribute'
    : 'class-expression'
}

function collectClassListContexts(
  content: string,
  filePath: string,
  lintSession: Pick<MasterCSSToolingSession, 'analyzeLintDocument'>
): ClassListContext[] {
  const positions = lintSession
    .analyzeLintDocument(content, getLanguageId(filePath))
    .classPositions
  const contexts = new Map<string, ClassListContext>()
  for (const position of positions) {
    const contextRange = position.contextRange
    const key = `${contextRange.start}:${contextRange.end}`
    const existing = contexts.get(key)
    if (existing) {
      existing.classNames.push(position.token)
      continue
    }
    const directive = findComposeDirective(content, contextRange)
    contexts.set(key, {
      range: contextRange,
      text: content.slice(contextRange.start, contextRange.end),
      sourceKind: directive ? 'compose-directive' : inferClassSourceKind(content, contextRange),
      unescape: detectClassListUnescape(content, contextRange),
      classNames: [position.token],
      ...(directive ? { directive } : {})
    })
  }
  return [...contexts.values()].sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end)
}

function offsetToLocation(content: string, offset: number): MasterCSSLintSourceLocation {
  let line = 1
  let lineStart = 0
  for (let index = 0; index < offset; index++) {
    if (content[index] === '\n') {
      line++
      lineStart = index + 1
    }
  }
  return {
    line,
    column: offset - lineStart + 1
  }
}

function toLocationRange(content: string, range: SourceRange): MasterCSSLintSourceLocationRange {
  return {
    start: offsetToLocation(content, range.start),
    end: offsetToLocation(content, range.end)
  }
}

function createContextLintDiagnostics(
  context: ClassListContext,
  rules: Record<MasterCSSLintRuleId, boolean>,
  options: MasterCSSLintContentOptions
) {
  const shouldAnalyze = Object.values(rules).some(Boolean)
  const diagnostics = shouldAnalyze
    ? options.lintSession.analyzeLintClassList(context.text, context.classNames, {
      disallowUnknownClass: options.ruleOptions?.['no-invalid-classes']?.disallowUnknownClass,
      rawValuePolicy: rules['no-unapproved-raw-values']
        ? options.ruleOptions?.['no-unapproved-raw-values'] || {}
        : undefined,
      canonicalOptions: rules['prefer-canonical-classes']
        ? options.ruleOptions?.['prefer-canonical-classes'] || {}
        : undefined,
      composeDirective: context.sourceKind === 'compose-directive'
    }).diagnostics
      .filter(({ ruleId }) => rules[ruleId])
      .map((diagnostic): MasterCSSLintDiagnostic => ({
        ...diagnostic,
        severity: options.severities?.[diagnostic.ruleId]
          || (diagnostic.ruleId === 'no-invalid-classes' ? 'error' : 'warning'),
        fix: diagnostic.fix
      }))
    : []
  return diagnostics
}

function toSourceFix(context: ClassListContext, fix: MasterCSSLintFix): MasterCSSLintSourceFix | undefined {
  if (fix.scope === 'directive') {
    if (!context.directive) return
    return {
      kind: 'directive',
      safety: 'structural',
      range: {
        start: context.directive.start,
        end: context.directive.end
      },
      text: fix.text,
      description: 'Apply structural @compose rewrite.',
      requiresFormatting: true
    }
  }
  return {
    kind: 'class-list',
    safety: 'safe',
    range: {
      start: context.range.start + fix.range.start,
      end: context.range.start + fix.range.end
    },
    text: fix.text,
    description: 'Replace the class list text.',
    requiresFormatting: false
  }
}

function toSourceDiagnostic(
  content: string,
  context: ClassListContext,
  diagnostic: MasterCSSLintDiagnostic
): MasterCSSLintSourceDiagnostic {
  const range = {
    start: context.range.start + diagnostic.range.start,
    end: context.range.start + diagnostic.range.end
  }
  const fix = diagnostic.fix && toSourceFix(context, diagnostic.fix)

  return {
    ruleId: diagnostic.ruleId,
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    range,
    loc: toLocationRange(content, range),
    source: 'Master CSS',
    sourceKind: context.sourceKind,
    ...(diagnostic.data ? { data: diagnostic.data } : {}),
    ...(fix ? { fixes: [fix] } : {})
  }
}

export function lintMasterCSSContent(options: MasterCSSLintContentOptions): MasterCSSLintFileResult {
  const diagnostics: MasterCSSLintSourceDiagnostic[] = []
  const rules = resolveRules(options.rules)
  for (const context of collectClassListContexts(options.content, options.filePath, options.lintSession)) {
    diagnostics.push(...createContextLintDiagnostics(context, rules, options).map((diagnostic) => toSourceDiagnostic(options.content, context, diagnostic)))
  }
  const languageId = getLanguageId(options.filePath)
  return {
    filePath: options.filePath,
    languageId,
    sourceKind: getFileSourceKind(languageId),
    diagnostics
  }
}

function applyReplacement(content: string, range: SourceRange, text: string) {
  return content.slice(0, range.start) + text + content.slice(range.end)
}

function uniqueFixes(fixes: MasterCSSLintSourceFix[]) {
  const seen = new Set<string>()
  return fixes.filter((fix) => {
    const key = `${fix.kind}:${fix.range.start}:${fix.range.end}:${fix.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function collectStructuralFixes(file: MasterCSSLintFileResult) {
  return uniqueFixes(file.diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? []))
    .filter((fix) => fix.kind === 'directive')
    .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)
}

function applyFixes(content: string, fixes: MasterCSSLintSourceFix[]) {
  let fixed = content
  for (const fix of fixes) {
    fixed = applyReplacement(fixed, fix.range, fix.text)
  }
  return fixed
}

function fixClassListText(context: ClassListContext, rules: Record<MasterCSSLintRuleId, boolean>, options: MasterCSSLintContentOptions) {
  let fixed = context.text
  for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
    const nextContext: ClassListContext = {
      ...context,
      range: { start: 0, end: fixed.length },
      text: fixed,
      classNames: options.lintSession.tokenizeClassList(fixed, context.unescape).map(({ token }) => token)
    }
    const fix = createContextLintDiagnostics(nextContext, rules, options)
      .map((diagnostic) => diagnostic.fix)
      .find((fix): fix is MasterCSSLintFix => Boolean(fix && fix.scope !== 'directive'))
    if (!fix) return fixed
    const next = applyReplacement(fixed, fix.range, fix.text)
    if (next === fixed) return fixed
    fixed = next
  }
  return fixed
}

function fixSafeClassLists(content: string, filePath: string, rules: Record<MasterCSSLintRuleId, boolean>, options: MasterCSSLintContentOptions) {
  const replacements = collectClassListContexts(content, filePath, options.lintSession)
    .map((context) => ({
      range: context.range,
      text: fixClassListText(context, rules, options)
    }))
    .filter((replacement) => content.slice(replacement.range.start, replacement.range.end) !== replacement.text)
    .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)

  return applyFixes(content, replacements.map((replacement) => ({
    kind: 'class-list',
    safety: 'safe',
    range: replacement.range,
    text: replacement.text,
    description: 'Replace the class list text.',
    requiresFormatting: false
  })))
}

export function fixMasterCSSContent(options: MasterCSSFixContentOptions) {
  const rules = resolveRules(options.rules)
  let fixed = fixSafeClassLists(options.content, options.filePath, rules, options)
  if (!options.includeDirectiveFixes) return fixed
  const structuralFixes = collectStructuralFixes(lintMasterCSSContent({
    ...options,
    content: fixed,
    rules
  }))
  if (structuralFixes.length) fixed = applyFixes(fixed, structuralFixes)
  return fixed
}

export function summarizeMasterCSSLintFiles(files: MasterCSSLintFileResult[]): MasterCSSLintSummary {
  const diagnostics = files.flatMap((file) => file.diagnostics)
  const fixes = diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? [])
  return {
    files: files.length,
    diagnostics: diagnostics.length,
    errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
    warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length,
    fixable: diagnostics.filter((diagnostic) => diagnostic.fixes?.length).length,
    safeFixes: fixes.filter((fix) => fix.safety === 'safe').length,
    structuralFixes: fixes.filter((fix) => fix.safety === 'structural').length
  }
}
