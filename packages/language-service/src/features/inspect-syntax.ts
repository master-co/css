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
  const messages = (inspection.diagnostics ?? []).map(diagnostic =>
    `**${diagnostic.code}**: ${diagnostic.message}${diagnostic.notes?.length ? `\n\n${diagnostic.notes.join('\n\n')}` : ''}`
  )
  if (!documentation && !messages.length) return
  const names = inspection.kind === 'token'
    ? [...new Set(inspection.variables.map(({ variable }) => `\`--${variable.name}\``))]
    : []
  const origin = inspection.kind === 'token'
    ? `Named token${names.length ? `: ${names.join(', ')}` : ''}`
    : inspection.kind === 'component' ? '(components)' : ''
  const status = inspection.cssValueStatus === 'invalid' || inspection.cssValueStatus === 'unknown'
    ? `CSS value check: **${inspection.cssValueStatus}**. Browser support: **${inspection.browserSupport}**.`
    : ''
  return {
    contents: { kind: 'markdown', value: [origin, documentation?.value, status, ...messages].filter(Boolean).join('\n\n') },
    range
  }
}
