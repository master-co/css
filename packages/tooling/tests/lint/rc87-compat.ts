import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  defaultCanonicalClassNameOptions,
  defaultClassLintSettings,
  fixMasterCSSContent as fixCurrentContent,
  lintMasterCSSContent as lintCurrentContent,
  resolveMasterCSSLintRules,
  summarizeMasterCSSLintFiles
} from '../../src/lint'
import type { MasterCSSToolingSession } from '../../src/tooling-session'
import { createTestToolingSession } from '../helpers/create-tooling-session'

interface CSSCompat {
  readonly manifest: MasterCSSManifest
  readonly session: MasterCSSToolingSession
  generate(className: string): unknown[]
}

interface GeneratedCompat extends Array<unknown> {
  __session?: MasterCSSToolingSession
}

interface ClassListItem {
  type: 'class' | 'space'
  start: number
  end: number
  raw: string
  token: string
}

const editSession = createTestToolingSession(defaultManifestJSON as unknown as MasterCSSManifest)

export {
  defaultCanonicalClassNameOptions,
  defaultClassLintSettings,
  resolveMasterCSSLintRules,
  summarizeMasterCSSLintFiles
}

export function createCSSWithNativeDeclarations(manifest: MasterCSSManifest): CSSCompat {
  const session = createTestToolingSession(manifest)
  return {
    manifest,
    session,
    generate(className) {
      const generated = [...session.inspectClassName(className).rules] as GeneratedCompat
      Object.defineProperty(generated, '__session', { value: session })
      return generated
    }
  }
}

function sessionFrom(
  css: Pick<CSSCompat, 'generate'>,
  classNames: string[] = []
): MasterCSSToolingSession {
  if ('session' in css) return (css as CSSCompat).session
  for (const className of [...new Set(classNames)]) {
    const generated = css.generate(className) as GeneratedCompat
    if (generated.__session) return generated.__session
  }
  throw new Error('The rc.87 lint adapter cannot resolve its Rust tooling session.')
}

function tokens(
  classList: string,
  session: MasterCSSToolingSession,
  unescape?: string | false
) {
  return session.tokenizeClassList(classList, unescape).map((item) => ({ ...item }))
}

function classNames(
  classList: string,
  session: MasterCSSToolingSession,
  unescape?: string | false
) {
  return tokens(classList, session, unescape).map(({ token }) => token)
}

function parseClassList(
  classList: string,
  unescape?: string | false
): ClassListItem[] {
  const parsed = tokens(classList, editSession, unescape)
  const items: ClassListItem[] = []
  let offset = 0
  for (const item of parsed) {
    if (item.range.start > offset) {
      items.push({
        type: 'space',
        start: offset,
        end: item.range.start,
        raw: classList.slice(offset, item.range.start),
        token: classList.slice(offset, item.range.start)
      })
    }
    items.push({
      type: 'class',
      start: item.range.start,
      end: item.range.end,
      raw: item.raw,
      token: item.token
    })
    offset = item.range.end
  }
  if (offset < classList.length) {
    items.push({
      type: 'space',
      start: offset,
      end: classList.length,
      raw: classList.slice(offset),
      token: classList.slice(offset)
    })
  }
  return items
}

function removeAt(items: ClassListItem[], index: number) {
  const previous = items[index - 1]
  const next = items[index + 1]
  if (previous?.type === 'space') {
    items.splice(index - 1, 2)
    return index - 1
  }
  if (next?.type === 'space') {
    items.splice(index, 2)
    return index
  }
  items.splice(index, 1)
  return index
}

function removeToken(items: ClassListItem[], token: string) {
  for (let index = 0; index < items.length; index++) {
    if (items[index].type !== 'class' || items[index].token !== token) continue
    removeAt(items, index)
    return true
  }
  return false
}

function replaceToken(items: ClassListItem[], token: string, replacement: string) {
  const item = items.find((candidate) => candidate.type === 'class' && candidate.token === token)
  if (!item) return false
  item.raw = replacement
  item.token = replacement
  return true
}

function buildClassList(items: ClassListItem[]) {
  return items.map(({ raw }) => raw).join('')
}

export function sortClassNames(classNames: string[], css: Pick<CSSCompat, 'generate'>) {
  const unique = [...new Set(classNames)]
  const generated = unique.map((className) => css.generate(className) as GeneratedCompat)
  const session = ('session' in css ? (css as CSSCompat).session : undefined)
    || generated.find(({ __session }) => __session)?.__session
  if (!session) throw new Error('Missing Rust lint session.')
  return [...session.lintClassNames(unique).sortedClassNames]
}

export function sortClassList(
  classList: string,
  css: CSSCompat,
  options: { unescape?: string | false } = {}
) {
  const items = parseClassList(classList, options.unescape)
  const classItems = items.filter((item) => item.type === 'class' && item.token)
  if (classItems.length <= 1) return classList
  const sorted = sortClassNames(classItems.map(({ token }) => token), css)
  const rawQueues = new Map<string, string[]>()
  for (const item of classItems) {
    const queue = rawQueues.get(item.token) || []
    queue.push(item.raw)
    rawQueues.set(item.token, queue)
  }
  let sortedIndex = 0
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (item.type !== 'class') continue
    const token = sorted[sortedIndex++]
    if (!token) {
      index = removeAt(items, index) - 1
      continue
    }
    item.raw = rawQueues.get(token)?.shift() || token
    item.token = token
  }
  return buildClassList(items)
}

export function removeClassNamesFromClassList(
  classList: string,
  names: string[],
  options: { unescape?: string | false } = {}
) {
  const items = parseClassList(classList, options.unescape)
  for (const name of names) removeToken(items, name)
  return buildClassList(items)
}

export function replaceClassNameInClassList(
  classList: string,
  name: string,
  replacement: string,
  options: { unescape?: string | false } = {}
) {
  const items = parseClassList(classList, options.unescape)
  replaceToken(items, name, replacement)
  return buildClassList(items)
}

export function replaceClassGroupInClassList(
  classList: string,
  names: string[],
  replacement: string,
  options: { unescape?: string | false } = {}
) {
  const [first, ...rest] = names
  const items = parseClassList(classList, options.unescape)
  if (!first || !replaceToken(items, first, replacement)) return classList
  for (const name of rest) removeToken(items, name)
  return buildClassList(items)
}

export function findClassConflicts(classNames: string[], css: CSSCompat) {
  return [...sessionFrom(css, classNames).lintClassNames(classNames).conflicts]
}

export function findPartialClassConflicts(classNames: string[], css: CSSCompat) {
  return [...sessionFrom(css, classNames).lintClassNames(classNames).partialConflicts]
}

export function findUnapprovedRawValueClasses(
  names: string[],
  css: CSSCompat,
  options: {
    allowRawValues?: boolean
    allowProperties?: string[]
    allowedPatterns?: string[]
  } = {}
) {
  if (options.allowRawValues) return []
  const allowed = new Set(options.allowProperties || [])
  const patterns = (options.allowedPatterns || []).map((pattern) => new RegExp(pattern))
  return sessionFrom(css, names).rawValueCandidates(names)
    .map((candidate) => {
      const segments = candidate.segments.filter((segment) =>
        !patterns.some((pattern) => pattern.test(segment))
      )
      return {
        className: candidate.className,
        key: candidate.key,
        value: segments.join('|'),
        properties: [...candidate.properties]
      }
    })
    .filter(({ key, value, properties }) =>
      Boolean(value) && !allowed.has(key) && !properties.some((property) => allowed.has(property))
    )
}

export function suggestCanonicalClassName(
  className: string,
  css: CSSCompat,
  options = defaultCanonicalClassNameOptions
) {
  return sessionFrom(css, [className]).canonicalClassNames([className], options)
    .find((suggestion) => suggestion.className === className)?.recommended
}

export function suggestCanonicalClassGroups(
  names: string[],
  css: CSSCompat,
  options = defaultCanonicalClassNameOptions
) {
  return [...sessionFrom(css, names).canonicalClassGroups(names, options)]
}

export function suggestCanonicalComposeDirective(
  classList: string,
  css: CSSCompat,
  options = defaultCanonicalClassNameOptions
) {
  const session = sessionFrom(css)
  return session.canonicalComposeDirective(classNames(classList, session), options)
}

function report(
  classList: string,
  css: CSSCompat,
  options: Record<string, unknown> = {}
) {
  const unescape = options.unescape as string | false | undefined
  const names = classNames(classList, css.session, unescape)
  const analysis = css.session.analyzeLintClassList(classList, names, {
    disallowUnknownClass: Boolean(options.disallowUnknownClass),
    rawValuePolicy: options.rawValuePolicy as never,
    canonicalOptions: options.canonicalOptions as never,
    composeDirective: Boolean(options.composeDirective)
  })
  return {
    diagnostics: analysis.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      severity: (options.severity as string | undefined) || 'warning'
    }))
  }
}

function only(reportValue: ReturnType<typeof report>, ruleId: string) {
  return {
    diagnostics: reportValue.diagnostics.filter((diagnostic) => diagnostic.ruleId === ruleId)
  }
}

export function createSortClassesReport(classList: string, css: CSSCompat, options = {}) {
  return only(report(classList, css, options), 'sort-classes')
}

export function createConflictingClassesReport(classList: string, css: CSSCompat, options = {}) {
  return only(report(classList, css, options), 'no-conflicting-classes')
}

export function createInvalidClassesReport(
  classList: string,
  css: CSSCompat,
  options: Record<string, unknown> = {}
) {
  return only(report(classList, css, options), 'no-invalid-classes')
}

export function createCanonicalClassesReport(
  classList: string,
  css: CSSCompat,
  options: Record<string, unknown> = {}
) {
  return only(report(classList, css, {
    ...options,
    canonicalOptions: options
  }), 'prefer-canonical-classes')
}

export function createCanonicalComposeDirectiveReport(
  classList: string,
  css: CSSCompat,
  options: Record<string, unknown> = {}
) {
  return only(report(classList, css, {
    ...options,
    canonicalOptions: options,
    composeDirective: true
  }), 'prefer-canonical-classes')
}

export function createClassListLintReport(
  classList: string,
  css: CSSCompat,
  options: Record<string, any> = {}
) {
  const rules = options.rules || {}
  const value = report(classList, css, {
    ...options,
    rawValuePolicy: rules['no-unapproved-raw-values']
      ? {
          allowRawValues: options.allowRawValues,
          allowProperties: options.allowProperties,
          allowedPatterns: options.allowedPatterns
        }
      : undefined,
    canonicalOptions: options
  })
  return {
    diagnostics: value.diagnostics
      .filter((diagnostic) => rules[diagnostic.ruleId] !== false)
      .filter((diagnostic) =>
        diagnostic.ruleId !== 'no-unapproved-raw-values'
        || rules['no-unapproved-raw-values'] === true
      )
      .map((diagnostic) => ({
        ...diagnostic,
        severity: options.severities?.[diagnostic.ruleId] || diagnostic.severity
      }))
  }
}

export function getClassValidationIssues(
  className: string,
  css: CSSCompat,
  options: { disallowUnknownClass?: boolean, displayClassName?: string } = {}
) {
  const diagnostics = createInvalidClassesReport(className, css, options).diagnostics
  return diagnostics.map((diagnostic) => ({
    kind: diagnostic.code === 'unknown-class' ? 'unknown' : 'invalid',
    className,
    message: options.displayClassName
      ? diagnostic.message.replace(className.replaceAll('"', '\\"'), options.displayClassName)
      : diagnostic.message
  }))
}

function sourceOptions(options: Record<string, any>) {
  const { css, ...rest } = options
  return { ...rest, lintSession: css.session }
}

export function lintMasterCSSContent(options: Record<string, any>) {
  return lintCurrentContent(
    sourceOptions(options) as Parameters<typeof lintCurrentContent>[0]
  )
}

export function fixMasterCSSContent(options: Record<string, any>) {
  return fixCurrentContent(
    sourceOptions(options) as Parameters<typeof fixCurrentContent>[0]
  )
}
