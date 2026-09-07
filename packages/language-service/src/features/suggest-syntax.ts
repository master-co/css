import {
  CompletionItemKind,
  InsertTextFormat,
  type CompletionItem,
  type CompletionParams
} from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageCompletionEntry } from '@master/css-tooling/language'
import type { MasterCSSLanguageService } from '../core'
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
      ? `${label.slice(0, -2)}($0)`
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
    const includeDocumentation = new Set([':first', ':hover', '::placeholder']).has(label)
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

function queryCompletionItems(
  entries: readonly MasterCSSLanguageCompletionEntry[],
  field: string
) {
  const operator = field.match(/(?:&)?(?:>=|<=|>|<)$/u)?.[0]?.replace(/^&/u, '')
    || (field.endsWith('&') ? '&' : '@')
  const comparisonsOnly = operator !== '@' && operator !== '&'
  const items: CompletionItem[] = entries
    .filter(({ label, sortText }) =>
      label.startsWith('@') && (!comparisonsOnly || sortText?.startsWith('0000-'))
    )
    .map((entry) => ({
      label: `${operator}${entry.label.slice(1)}`,
      filterText: entry.label.slice(1),
      insertText: entry.label.slice(1),
      detail: entry.detail,
      kind: CompletionItemKind.Keyword,
      sortText: entry.sortText
    } satisfies CompletionItem))
  if (operator === '@') {
    for (const name of ['container', 'media', 'supports']) {
      items.push({
        label: `@${name}()`,
        filterText: `${name}()`,
        insertText: `${name}()`,
        sortText: `2000-${name}`
      })
    }
  }
  return sortCompletionItems(items)
}

export default function suggestSyntax(
  this: MasterCSSLanguageService,
  document: TextDocument,
  position: CompletionParams['position'],
  context: CompletionParams['context']
): CompletionItem[] | undefined {
  const classPosition = this.getClassPosition(document, position)
  if (!classPosition) return
  const query = context?.triggerCharacter === ' '
    ? ''
    : document.getText({
        start: document.positionAt(classPosition.range.start),
        end: position
      })
  const fields = query.split(' ')
  let field = fields[fields.length - 1] || ''
  const entries = this.session.completionIndex().classEntries
  if (!field || context?.triggerCharacter === ' ') {
    return rootCompletionItems(this, entries, '')
  }
  const isGroup = field.startsWith('{')
  if (isGroup) {
    const declarationStart = field.lastIndexOf(';')
    field = field.slice(declarationStart < 0 ? 1 : declarationStart + 1)
    if (!field) return rootCompletionItems(this, entries, '')
  }
  if (field.startsWith('@') || field.startsWith('~')) return []

  const component = entries.find(({ label, detail }) => label === field.slice(0, -1) && detail === 'component')
  if (field.endsWith(':') && component) return

  const atIndex = field.lastIndexOf('@')
  if (atIndex > 0 && /[@&<>=]$/u.test(field)) {
    if (isGroup) return
    return queryCompletionItems(entries, field)
  }

  const keyMatch = field.match(/^([^'":\s]+):/u)
  const key = keyMatch?.[1]
  const property = key && entries.some(({ label }) => label.startsWith(`${key}:`))
  const hasSelectorSuffix = Boolean(keyMatch && field.slice(keyMatch[0].length).includes(':'))
  if (key && property && !hasSelectorSuffix && atIndex < 0) {
    const values = valueCompletionItems(this, entries, key, field.slice(keyMatch?.[0].length))
    return values.length ? values : rootCompletionItems(this, entries, '')
  }

  if (/[:_>+~]$/u.test(field)) {
    if (isGroup) return
    return selectorCompletionItems(this, entries, field)
  }

  if (key && atIndex < 0) {
    const values = valueCompletionItems(this, entries, key, field.slice(keyMatch?.[0].length))
    return values.length ? values : rootCompletionItems(this, entries, '')
  }
  return rootCompletionItems(this, entries, field)
}
