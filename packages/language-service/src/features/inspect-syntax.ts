import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type CSSLanguageService from '../core'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'

export default function inspectSyntax(
  this: CSSLanguageService,
  document: TextDocument,
  position: HoverParams['position']
): Hover | undefined {
  const classPosition = this.getClassPosition(document, position)
  if (!classPosition) return
  const inspection = this.session.inspectClassName(classPosition.token)
  const documentation = createCSSMarkdownDocumentation(inspection.text)
  if (!documentation) return
  const range: Range = {
    start: document.positionAt(classPosition.range.start),
    end: document.positionAt(classPosition.range.end)
  }
  return inspection.kind === 'component'
    ? { contents: { kind: documentation.kind, value: `(components) ${documentation.value}` }, range }
    : { contents: documentation, range }
}
