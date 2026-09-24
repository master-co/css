import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageService } from '../core'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'

export default function inspectSyntax(
  this: MasterCSSLanguageService,
  document: TextDocument,
  position: HoverParams['position']
): Hover | undefined {
  const classPosition = this.getClassPosition(document, position)
  if (!classPosition) return
  const inspection = this.session.inspectClassName(classPosition.token)
  const documentation = createCSSMarkdownDocumentation(inspection.text)
  const range: Range = {
    start: document.positionAt(classPosition.range.start),
    end: document.positionAt(classPosition.range.end)
  }
  if (inspection.diagnostics?.length) {
    return { contents: { kind: 'markdown', value: inspection.diagnostics.map(diagnostic => diagnostic.message).join('\n\n') }, range }
  }
  if (!documentation) return
  if (inspection.kind === 'token') {
    const names = [...new Set(inspection.variables.map(({ variable }) => `\`--${variable.name}\``))]
    return { contents: { kind: documentation.kind, value: `Named token${names.length ? `: ${names.join(', ')}` : ''}\n\n${documentation.value}` }, range }
  }
  return inspection.kind === 'component'
    ? { contents: { kind: documentation.kind, value: `(components) ${documentation.value}` }, range }
    : { contents: documentation, range }
}
