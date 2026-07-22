import {
  CompletionItemKind,
  type CompletionItem,
  type CompletionParams
} from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type CSSLanguageService from '../core'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'

export default function suggestSyntax(
  this: CSSLanguageService,
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
  return this.session.completionIndex().classEntries
    .filter(({ label }) => !query || label.startsWith(query))
    .map((entry) => ({
      label: entry.label,
      kind: entry.kind === 'property' ? CompletionItemKind.Property : CompletionItemKind.Value,
      detail: entry.detail,
      documentation: entry.documentationText
        ? createCSSMarkdownDocumentation(entry.documentationText)
        : undefined,
      sortText: entry.sortText,
      command: entry.triggerSuggest
        ? { title: 'Suggest', command: 'editor.action.triggerSuggest' }
        : undefined
    }))
}
