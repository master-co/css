import {
  CompletionItemKind,
  InsertTextFormat,
  type CompletionItem,
  type CompletionParams,
  type Range
} from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageCompletionEntry } from '@master/css-tooling/language'
import type { MasterCSSLanguageService } from '../core'
import { analyzeDocument, documentRequest } from '../document-analysis'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'

function sortCompletionItems(items: CompletionItem[]) {
  return items.sort((left, right) =>
    (left.sortText || left.label).localeCompare(
      right.sortText || right.label,
      undefined,
      { numeric: true }
    )
  )
}

function documentation(
  service: MasterCSSLanguageService,
  entry: MasterCSSLanguageCompletionEntry,
  className: string
) {
  const text = entry.documentationText || service.session.inspectClassName(className).text
  return text ? createCSSMarkdownDocumentation(text) : undefined
}

function classCompletionItem(
  service: MasterCSSLanguageService,
  entry: MasterCSSLanguageCompletionEntry,
  label = entry.label,
  className = entry.label,
  generateDocumentation = false
): CompletionItem {
  return {
    label,
    kind: entry.kind === 'property'
      ? CompletionItemKind.Property
      : entry.kind === 'function'
        ? CompletionItemKind.Function
        : CompletionItemKind.Value,
    insertText: entry.kind === 'function'
      ? entry.insertText ?? `${label.slice(0, -2)}($0)`
      : undefined,
    insertTextFormat: entry.kind === 'function' ? InsertTextFormat.Snippet : undefined,
    detail: entry.detail,
    documentation: entry.documentationText || generateDocumentation
      ? documentation(service, entry, className)
      : undefined,
    sortText: entry.sortText,
    command: entry.triggerSuggest
      ? { title: 'Suggest', command: 'editor.action.triggerSuggest' }
      : undefined
  }
}

/**
 * Root candidates for the class typed so far. A `(property:` head also matches the
 * bare property name, and replaces the whole typed class so its parenthesis is
 * never doubled.
 */
function rootCompletionItems(
  service: MasterCSSLanguageService,
  entries: readonly MasterCSSLanguageCompletionEntry[],
  query: string,
  range?: Range
) {
  return sortCompletionItems(entries
    .filter(({ label }) => {
      if (label.startsWith(':') || label.startsWith('@')) return false
      if (label.includes(':') && !label.endsWith(':')) return false
      return !query || label.startsWith(query) || (label.startsWith('(') && label.startsWith(query, 1))
    })
    .map((entry) => {
      const item = classCompletionItem(service, entry)
      if (range) {
        item.filterText = entry.label.startsWith('(') && !query.startsWith('(') ? entry.label.slice(1) : entry.label
        item.textEdit = { range, newText: item.insertText ?? entry.label }
        item.insertText = undefined
      }
      return item
    }))
}

/** Values of a `(property:` head; `suffix` is the text the head still lacks, such as its `)`. */
function valueCompletionItems(
  service: MasterCSSLanguageService,
  entries: readonly MasterCSSLanguageCompletionEntry[],
  key: string,
  valuePrefix: string,
  range: Range,
  suffix: string
) {
  const prefix = `(${key}:`
  return sortCompletionItems(entries
    .filter(({ kind, label }) => kind !== 'property' && label.startsWith(prefix) && label.endsWith(')'))
    .filter(({ label }) => valuePrefix.startsWith('-') || !label.slice(prefix.length).startsWith('-'))
    .map((entry) => {
      const value = entry.label.slice(prefix.length, -1)
      const item = classCompletionItem(service, entry, value, entry.label, entry.label === '(font-style:italic)')
      item.filterText = value
      item.textEdit = {
        range,
        newText: entry.kind === 'function' ? `${value.slice(0, -1)}$0)${suffix}` : `${value}${suffix}`
      }
      item.insertText = undefined
      return item
    }))
}

const SELECTOR_TRIGGER = /(?:::?|[_>+~])$/u

const hasSyntaxError = (diagnostics?: readonly { readonly code: string }[]) =>
  Boolean(diagnostics?.some(({ code }) => code === 'CLASS_SYNTAX_ERROR'))

function selectorCompletionItems(
  service: MasterCSSLanguageService,
  entries: readonly MasterCSSLanguageCompletionEntry[],
  field: string
) {
  const elementOnly = field.endsWith('::')
  const triggerLength = elementOnly ? 2 : field.endsWith(':') ? 1 : 0
  const byLabel = new Map<string, CompletionItem>()
  for (const entry of entries) {
    if (!entry.label.startsWith(':')) continue
    if (elementOnly && !entry.label.startsWith('::')) continue
    const label = entry.label
    if (byLabel.has(label)) continue
    const insertText = triggerLength
      ? label.slice(triggerLength)
      : undefined
    const className = `${field}${triggerLength ? label.slice(triggerLength) : label}`
    const includeDocumentation = new Set([':first-child', ':hover', '::placeholder']).has(label)
    byLabel.set(label, {
      label,
      insertText,
      kind: CompletionItemKind.Function,
      detail: entry.detail,
      documentation: entry.documentationText || includeDocumentation
        ? documentation(service, entry, className)
        : undefined,
      sortText: entry.sortText
    })
  }
  return sortCompletionItems([...byLabel.values()])
}

function queryCompletionItems(entries: readonly MasterCSSLanguageCompletionEntry[]) {
  return sortCompletionItems(entries.filter(({ label }) => label.startsWith('@')).map(entry => ({
    label: entry.label,
    filterText: entry.label.slice(1),
    insertText: entry.label.slice(1),
    detail: entry.detail,
    kind: entry.kind === 'function' ? CompletionItemKind.Function : CompletionItemKind.Keyword,
    sortText: entry.sortText
  })))
}

export default function suggestSyntax(
  this: MasterCSSLanguageService,
  document: TextDocument,
  position: CompletionParams['position'],
  context: CompletionParams['context']
): CompletionItem[] | undefined {
  const offset = document.offsetAt(position)
  const keyframe = analyzeDocument(this, document).keyframePositions.find(({ range }) => offset >= range.start && offset <= range.end)
  if (keyframe) {
    return this.session.completionIndex().keyframes.map(entry => ({
      label: entry.name,
      kind: CompletionItemKind.Value,
      documentation: createCSSMarkdownDocumentation(entry.text),
      textEdit: {
        range: { start: document.positionAt(keyframe.range.start), end: document.positionAt(keyframe.range.end) },
        newText: keyframe.raw ? entry.insertText : ` ${entry.insertText} `
      }
    }))
  }
  const classPosition = this.getClassPosition(document, position)
  if (!classPosition) return
  const query = context?.triggerCharacter === ' '
    ? ''
    : document.getText({
        start: document.positionAt(classPosition.range.start),
        end: position
      })
  // Class boundaries, including quoted arguments, come from the Rust document analysis.
  const field = query
  const entries = this.session.completionIndex().classEntries
  if (!field || context?.triggerCharacter === ' ') {
    return rootCompletionItems(this, entries, '')
  }
  if (field.startsWith('@') || field.startsWith('~')) return []
  const typed: Range = { start: document.positionAt(classPosition.range.start), end: position }

  // A selector trigger after a complete class begins its selector suffix.
  const trigger = field.match(SELECTOR_TRIGGER)?.[0]
  if (trigger && trigger.length < field.length) {
    const head = this.session.inspectClassName(field.slice(0, -trigger.length))
    if (head.kind !== 'unknown' && !hasSyntaxError(head.diagnostics)) {
      return selectorCompletionItems(this, entries, field)
    }
  }

  // Inside a `(property:value)` head, Rust reports the component at the cursor: its
  // property, typed prefix, whole source range and the text the head still lacks.
  if (field.startsWith('(')) {
    const head = this.session.nativeDeclarationCompletion({ ...documentRequest(this, document), offset })
    if (head) {
      if (head.kind === 'none' || !head.range) return []
      const range: Range = { start: document.positionAt(head.range.start), end: document.positionAt(head.range.end) }
      if (head.kind === 'property') return rootCompletionItems(this, entries, `(${head.prefix}`, { start: typed.start, end: range.end })
      return valueCompletionItems(this, entries, head.property ?? '', head.prefix, range, head.suffix ?? '')
    }
  }
  const inspection = this.session.inspectClassName(field)
  if (hasSyntaxError(inspection.diagnostics)) return []
  // Conditions start at a top-level `@` of the suffix after the class head.
  const suffix = inspection.suffix ?? ''
  if (suffix.includes('@')) {
    if (field.endsWith('@')) return queryCompletionItems(entries)
    // Native query contents are not property or selector completions.
    return []
  }
  if (suffix || inspection.kind === 'declaration') return []
  return rootCompletionItems(this, entries, field, typed)
}
