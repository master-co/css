import {
  CompletionItemKind,
  InsertTextFormat,
  type CompletionItem,
  type CompletionParams
} from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageCompletionEntry } from '@master/css-tooling/language'
import type { MasterCSSLanguageService } from '../core'
import { analyzeDocument } from '../document-analysis'
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

function rootCompletionItems(
  service: MasterCSSLanguageService,
  entries: readonly MasterCSSLanguageCompletionEntry[],
  query: string
) {
  return sortCompletionItems(entries
    .filter(({ label }) => {
      if (label.startsWith(':') || label.startsWith('@')) return false
      if (label.includes(':') && !label.endsWith(':')) return false
      return !query || label.startsWith(query)
    })
    .map((entry) => classCompletionItem(service, entry)))
}

function valueCompletionItems(
  service: MasterCSSLanguageService,
  entries: readonly MasterCSSLanguageCompletionEntry[],
  key: string,
  valuePrefix = ''
) {
  const prefix = `${key}:`
  return sortCompletionItems(entries
    .filter(({ kind, label }) => kind !== 'property' && label.startsWith(prefix))
    .filter(({ label }) => valuePrefix.startsWith('-') || !label.slice(prefix.length).startsWith('-'))
    .map((entry) => classCompletionItem(
      service,
      entry,
      entry.label.slice(prefix.length),
      entry.label,
      entry.label === 'font-style:italic'
    )))
}

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

  const inspection = this.session.inspectClassName(field)
  if (inspection.diagnostics?.some(({ code }) => code === 'CLASS_SYNTAX_ERROR')) return []
  const state = inspection.stateToken ?? ''
  const atIndex = inspection.kind === 'mixin'
    ? state.includes('@') ? field.length - state.length + state.lastIndexOf('@') : -1
    : field.lastIndexOf('@')
  if (atIndex > 0) {
    if (field.endsWith('@')) return queryCompletionItems(entries)
    // Native query contents and retired shorthand are not property or selector completions.
    return []
  }

  const keyMatch = field.match(/^([^'":\s]+):/u)
  const key = keyMatch?.[1]
  const property = key && entries.some(({ label }) => label.startsWith(`${key}:`))
  const hasSelectorSuffix = Boolean(keyMatch && field.slice(keyMatch[0].length).includes(':'))
  if (/[:_>+~]$/u.test(field) && inspection.stateToken) {
    return selectorCompletionItems(this, entries, field)
  }
  if (key && property && !hasSelectorSuffix && atIndex < 0) {
    const values = valueCompletionItems(this, entries, key, field.slice(keyMatch?.[0].length))
    return values.length ? values : rootCompletionItems(this, entries, '')
  }

  if (/[:_>+~]$/u.test(field)) {
    return selectorCompletionItems(this, entries, field)
  }

  if (key && atIndex < 0) {
    const values = valueCompletionItems(this, entries, key, field.slice(keyMatch?.[0].length))
    return values.length ? values : rootCompletionItems(this, entries, '')
  }
  return rootCompletionItems(this, entries, field)
}
