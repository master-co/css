import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageService } from '../core'
import { analyzeDocument } from '../document-analysis'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'

export default function inspectSyntax(
  this: MasterCSSLanguageService,
  document: TextDocument,
  position: HoverParams['position']
): Hover | undefined {
  const offset = document.offsetAt(position)
  const keyframe = analyzeDocument(this, document).keyframePositions.find(({ range }) => offset >= range.start && offset <= range.end)
  if (keyframe) {
    const entry = this.session.completionIndex().keyframes.find(entry => entry.name === keyframe.token)
    if (!entry) return
    const origins = entry.sources.map(source => `${source.file || 'stylesheet'}${source.loc ? `:${source.loc.start.line}` : ''}`).join('\n')
    return {
      contents: { kind: 'markdown', value: [createCSSMarkdownDocumentation(entry.text)?.value, origins].filter(Boolean).join('\n\n') },
      range: { start: document.positionAt(keyframe.range.start), end: document.positionAt(keyframe.range.end) }
    }
  }
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
