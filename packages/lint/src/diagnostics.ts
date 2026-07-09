import type { MasterCSS } from '@master/css-engine'
import { parseMasterCSSClassList, type MasterCSSClassListItem } from '@master/css-lexer'
import type { ClassValidationOptions } from './get-class-validation-issues'
import getClassValidationIssues from './get-class-validation-issues'
import type { MasterCSSClassListEditOptions } from './class-list-edits'
import {
  removeClassNamesFromClassList,
  replaceClassGroupInClassList,
  replaceClassNameInClassList,
  sortClassList
} from './class-list-edits'
import findClassConflicts from './find-class-conflicts'
import findPartialClassConflicts from './find-partial-class-conflicts'
import type { RawValuePolicyOptions } from './find-unapproved-raw-value-classes'
import findUnapprovedRawValueClasses from './find-unapproved-raw-value-classes'
import type { CanonicalClassNameOptions } from './suggest-canonical-class-name'
import { defaultCanonicalClassNameOptions } from './suggest-canonical-class-name'
import suggestCanonicalClassGroups from './suggest-canonical-class-groups'
import suggestCanonicalClassName from './suggest-canonical-class-name'
import suggestCanonicalComposeDirective from './suggest-canonical-compose-directive'
import {
  formatClassList,
  formatClassName,
  quoteDiagnosticValue
} from './diagnostic-format'

export type MasterCSSLintRuleId =
  | 'sort-classes'
  | 'no-invalid-classes'
  | 'no-conflicting-classes'
  | 'prefer-canonical-classes'
  | 'no-unapproved-raw-values'

export type MasterCSSLintDiagnosticSeverity = 'error' | 'warning'

export interface MasterCSSLintRange {
  start: number
  end: number
}

export interface MasterCSSLintFix {
  range: MasterCSSLintRange
  text: string
  scope?: 'class-list' | 'directive'
}

export type MasterCSSLintDiagnosticData = Record<string, string | number | boolean | string[] | null | undefined>

export interface MasterCSSLintDiagnostic {
  ruleId: MasterCSSLintRuleId
  code: string
  message: string
  severity: MasterCSSLintDiagnosticSeverity
  range: MasterCSSLintRange
  data?: MasterCSSLintDiagnosticData
  fix?: MasterCSSLintFix
}

export interface MasterCSSLintReport {
  diagnostics: MasterCSSLintDiagnostic[]
}

export interface MasterCSSLintReportOptions extends MasterCSSClassListEditOptions {
  severity?: MasterCSSLintDiagnosticSeverity
}

export interface MasterCSSInvalidClassesReportOptions extends MasterCSSLintReportOptions, ClassValidationOptions { }

export type MasterCSSConflictingClassesReportOptions = MasterCSSLintReportOptions

export interface MasterCSSCanonicalClassesReportOptions extends MasterCSSLintReportOptions, CanonicalClassNameOptions { }

export interface MasterCSSUnapprovedRawValueClassesReportOptions extends MasterCSSLintReportOptions, RawValuePolicyOptions { }

export interface MasterCSSClassListLintReportOptions extends MasterCSSInvalidClassesReportOptions, RawValuePolicyOptions, CanonicalClassNameOptions {
  rules?: Partial<Record<MasterCSSLintRuleId, boolean>>
  severities?: Partial<Record<MasterCSSLintRuleId, MasterCSSLintDiagnosticSeverity>>
}

const defaultSeverityByRule: Record<MasterCSSLintRuleId, MasterCSSLintDiagnosticSeverity> = {
  'sort-classes': 'warning',
  'no-invalid-classes': 'error',
  'no-conflicting-classes': 'warning',
  'prefer-canonical-classes': 'warning',
  'no-unapproved-raw-values': 'warning'
}

function createReport(diagnostics: MasterCSSLintDiagnostic[] = []): MasterCSSLintReport {
  return { diagnostics }
}

function resolveSeverity(ruleId: MasterCSSLintRuleId, severity?: MasterCSSLintDiagnosticSeverity) {
  return severity || defaultSeverityByRule[ruleId]
}

function wholeClassListRange(classList: string): MasterCSSLintRange {
  return { start: 0, end: classList.length }
}

function wholeClassListFix(classList: string, text: string): MasterCSSLintFix | undefined {
  return classList === text
    ? undefined
    : {
      range: wholeClassListRange(classList),
      text,
      scope: 'class-list'
    }
}

function parseClassList(classList: string, options: MasterCSSClassListEditOptions = {}) {
  return parseMasterCSSClassList(classList, {
    preserveSpaces: true,
    ...options
  })
}

function classItems(items: MasterCSSClassListItem[]) {
  return items.filter((item) => item.type === 'class')
}

function classValues(items: MasterCSSClassListItem[]) {
  return classItems(items).map((item) => item.token)
}

function createClassItemQueues(items: MasterCSSClassListItem[]) {
  const queues = new Map<string, MasterCSSClassListItem[]>()
  for (const item of classItems(items)) {
    const queue = queues.get(item.token)
    if (queue) {
      queue.push(item)
    } else {
      queues.set(item.token, [item])
    }
  }
  return queues
}

function findClassItem(items: MasterCSSClassListItem[], className: string) {
  return classItems(items).find((item) => item.token === className)
}

function toRange(item: MasterCSSClassListItem | undefined, fallback: MasterCSSLintRange): MasterCSSLintRange {
  return item
    ? { start: item.start, end: item.end }
    : fallback
}

function formatFullConflictMessage(removedClassNames: string[], keptClassNames: string[]) {
  const removedPlural = removedClassNames.length !== 1
  const keptPlural = keptClassNames.length !== 1
  return [
    `Remove ${removedPlural ? 'classes' : 'class'} ${formatClassList(removedClassNames)}`,
    `${removedPlural ? 'they are' : 'it is'} overridden by later ${keptPlural ? 'classes' : 'class'} ${formatClassList(keptClassNames)}.`
  ].join('; ')
}

function formatPartialConflictMessage(actual: string, replacement: string, conflict: string) {
  return `Replace ${formatClassName(actual)} with ${formatClassList(replacement)}; later class ${formatClassName(conflict)} overrides part of ${formatClassName(actual)}.`
}

function formatCanonicalClassMessage(actual: string, recommended: string) {
  return `Use canonical class ${formatClassName(recommended)} instead of ${formatClassList(actual)}.`
}

function formatCanonicalComposeMessage(actual: string, recommended: string, kind: string) {
  if (kind === 'native-declaration') {
    return `Use CSS declaration \`${recommended}\` instead of class ${formatClassName(actual)}.`
  }
  if (kind === 'variant-block') {
    return `Move class ${formatClassName(actual)} into the canonical @compose block.`
  }
  return formatCanonicalClassMessage(actual, recommended)
}

export function createSortClassesReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSLintReportOptions = {}
): MasterCSSLintReport {
  const items = parseClassList(classList, options)
  if (classItems(items).length <= 1) return createReport()

  const fixedText = sortClassList(classList, css, options)
  const fix = wholeClassListFix(classList, fixedText)
  if (!fix) return createReport()

  const actual = classValues(items).join(' ')
  const expected = classValues(parseClassList(fixedText, options)).join(' ')
  return createReport([{
    ruleId: 'sort-classes',
    code: 'invalid-class-order',
    message: `Sort classes into the expected order: ${formatClassList(expected)}.`,
    severity: resolveSeverity('sort-classes', options.severity),
    range: wholeClassListRange(classList),
    data: {
      actual,
      expected
    },
    fix
  }])
}

export function createInvalidClassesReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSInvalidClassesReportOptions = {}
): MasterCSSLintReport {
  const items = parseClassList(classList, options)
  const diagnostics: MasterCSSLintDiagnostic[] = []

  for (const item of classItems(items)) {
    const issues = getClassValidationIssues(item.token, css, {
      disallowUnknownClass: options.disallowUnknownClass
    })
    for (const issue of issues) {
      diagnostics.push({
        ruleId: 'no-invalid-classes',
        code: issue.kind === 'invalid' ? 'invalid-class' : 'unknown-class',
        message: issue.message,
        severity: resolveSeverity('no-invalid-classes', options.severity),
        range: { start: item.start, end: item.end },
        data: {
          className: issue.className,
          kind: issue.kind,
          message: issue.message
        }
      })
    }
  }

  return createReport(diagnostics)
}

export function createConflictingClassesReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSConflictingClassesReportOptions = {}
): MasterCSSLintReport {
  const items = parseClassList(classList, options)
  const values = classValues(items)
  const fallbackRange = wholeClassListRange(classList)
  const severity = resolveSeverity('no-conflicting-classes', options.severity)
  const conflicts = findClassConflicts(values, css)

  if (conflicts.length) {
    const classNamesToRemove = conflicts.map(({ className }) => className)
    const keptClassNames = [...new Set(conflicts.flatMap(({ conflicts }) => conflicts))]
    const fixedText = removeClassNamesFromClassList(classList, classNamesToRemove, options)
    const firstClassItem = findClassItem(items, classNamesToRemove[0])
    const message = formatFullConflictMessage(classNamesToRemove, keptClassNames)
    return createReport([{
      ruleId: 'no-conflicting-classes',
      code: 'conflicting-class',
      message,
      severity,
      range: toRange(firstClassItem, fallbackRange),
      data: {
        message,
        classNames: classNamesToRemove,
        conflicts: keptClassNames,
        removed: classNamesToRemove.join(' '),
        kept: keptClassNames.join(' ')
      },
      fix: wholeClassListFix(classList, fixedText)
    }])
  }

  const partialConflicts = findPartialClassConflicts(values, css)
  if (!partialConflicts.length) return createReport()

  let fixedText = classList
  for (const conflict of partialConflicts) {
    fixedText = replaceClassNameInClassList(fixedText, conflict.className, conflict.replacement, options)
  }

  const queues = createClassItemQueues(items)
  const diagnostics: MasterCSSLintDiagnostic[] = []
  for (const conflict of partialConflicts) {
    const classItem = queues.get(conflict.className)?.shift()
    diagnostics.push({
      ruleId: 'no-conflicting-classes',
      code: 'partially-conflicting-class',
      message: formatPartialConflictMessage(conflict.className, conflict.replacement, conflict.conflict),
      severity,
      range: toRange(classItem, fallbackRange),
      data: {
        actual: conflict.className,
        replacement: conflict.replacement,
        conflict: conflict.conflict
      },
      fix: wholeClassListFix(classList, fixedText)
    })
  }

  return createReport(diagnostics)
}

export function createCanonicalClassesReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSCanonicalClassesReportOptions = {}
): MasterCSSLintReport {
  const resolvedOptions = {
    ...defaultCanonicalClassNameOptions,
    ...options
  }
  const items = parseClassList(classList, options)
  const values = classValues(items)
  const fallbackRange = wholeClassListRange(classList)
  const severity = resolveSeverity('prefer-canonical-classes', options.severity)
  const groupSuggestions = suggestCanonicalClassGroups(values, css, resolvedOptions)
  const coveredClassNames = new Set(groupSuggestions.flatMap((suggestion) => suggestion.classNames))
  const diagnostics: MasterCSSLintDiagnostic[] = []
  let fixedText = classList

  for (const suggestion of groupSuggestions) {
    const firstClassItem = findClassItem(items, suggestion.classNames[0])
    fixedText = replaceClassGroupInClassList(fixedText, suggestion.classNames, suggestion.recommended, options)
    diagnostics.push({
      ruleId: 'prefer-canonical-classes',
      code: 'prefer-canonical-class',
      message: formatCanonicalClassMessage(suggestion.classNames.join(' '), suggestion.recommended),
      severity,
      range: toRange(firstClassItem, fallbackRange),
      data: {
        actual: suggestion.classNames.join(' '),
        recommended: suggestion.recommended
      }
    })
  }

  for (const item of classItems(items)) {
    if (coveredClassNames.has(item.token)) continue
    const recommended = suggestCanonicalClassName(item.token, css, resolvedOptions)
    if (!recommended) continue
    fixedText = replaceClassNameInClassList(fixedText, item.token, recommended, options)
    diagnostics.push({
      ruleId: 'prefer-canonical-classes',
      code: 'prefer-canonical-class',
      message: formatCanonicalClassMessage(item.token, recommended),
      severity,
      range: { start: item.start, end: item.end },
      data: {
        actual: item.token,
        recommended
      }
    })
  }

  const fix = wholeClassListFix(classList, fixedText)
  for (const diagnostic of diagnostics) {
    diagnostic.fix = fix
  }
  return createReport(diagnostics)
}

export function createCanonicalComposeDirectiveReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSCanonicalClassesReportOptions = {}
): MasterCSSLintReport {
  const result = suggestCanonicalComposeDirective(classList, css, {
    ...defaultCanonicalClassNameOptions,
    ...options
  })
  if (!result) return createReport()
  if (!result.structuralChange) return createCanonicalClassesReport(classList, css, options)

  const items = parseClassList(classList, options)
  const fallbackRange = wholeClassListRange(classList)
  const severity = resolveSeverity('prefer-canonical-classes', options.severity)
  const fix = result.replacement
    ? {
      range: wholeClassListRange(classList),
      text: result.replacement,
      scope: 'directive' as const
    }
    : undefined

  return createReport(result.suggestions.map((suggestion) => {
    const firstClassItem = findClassItem(items, suggestion.classNames[0]) || classItems(items)[0]
    const diagnostic: MasterCSSLintDiagnostic = {
      ruleId: 'prefer-canonical-classes',
      code: suggestion.kind === 'class' ? 'prefer-canonical-class' : `prefer-${suggestion.kind}`,
      message: formatCanonicalComposeMessage(suggestion.actual, suggestion.recommended, suggestion.kind),
      severity,
      range: toRange(firstClassItem, fallbackRange),
      data: {
        actual: suggestion.actual,
        recommended: suggestion.recommended,
        kind: suggestion.kind
      },
      fix
    }
    return diagnostic
  }))
}

export function createUnapprovedRawValueClassesReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSUnapprovedRawValueClassesReportOptions = {}
): MasterCSSLintReport {
  const items = parseClassList(classList, options)
  const values = classValues(items)
  const severity = resolveSeverity('no-unapproved-raw-values', options.severity)
  const issues = findUnapprovedRawValueClasses(values, css, options)
  const diagnostics: MasterCSSLintDiagnostic[] = []

  for (const issue of issues) {
    const classItem = findClassItem(items, issue.className)
    if (!classItem) continue
    diagnostics.push({
      ruleId: 'no-unapproved-raw-values',
      code: 'unapproved-raw-value',
      message: `Raw value ${quoteDiagnosticValue(issue.value)} is not approved for class ${formatClassName(issue.className)}. Use a token or allow the value explicitly.`,
      severity,
      range: { start: classItem.start, end: classItem.end },
      data: {
        className: issue.className,
        value: issue.value,
        key: issue.key,
        properties: issue.properties
      }
    })
  }

  return createReport(diagnostics)
}

export function createClassListLintReport(
  classList: string,
  css: MasterCSS,
  options: MasterCSSClassListLintReportOptions = {}
): MasterCSSLintReport {
  const rules: Record<MasterCSSLintRuleId, boolean> = {
    'sort-classes': true,
    'no-invalid-classes': true,
    'no-conflicting-classes': true,
    'prefer-canonical-classes': true,
    'no-unapproved-raw-values': false,
    ...options.rules
  }
  const withRuleSeverity = <T extends MasterCSSLintReportOptions>(ruleId: MasterCSSLintRuleId, ruleOptions: T): T => ({
    ...ruleOptions,
    severity: options.severities?.[ruleId] || ruleOptions.severity || defaultSeverityByRule[ruleId]
  })
  const reports = [
    rules['sort-classes'] && createSortClassesReport(classList, css, withRuleSeverity('sort-classes', options)),
    rules['no-invalid-classes'] && createInvalidClassesReport(classList, css, withRuleSeverity('no-invalid-classes', options)),
    rules['no-conflicting-classes'] && createConflictingClassesReport(classList, css, withRuleSeverity('no-conflicting-classes', options)),
    rules['prefer-canonical-classes'] && createCanonicalClassesReport(classList, css, withRuleSeverity('prefer-canonical-classes', options)),
    rules['no-unapproved-raw-values'] && createUnapprovedRawValueClassesReport(classList, css, withRuleSeverity('no-unapproved-raw-values', options))
  ].filter((report): report is MasterCSSLintReport => Boolean(report))

  return createReport(reports.flatMap((report) => report.diagnostics))
}
