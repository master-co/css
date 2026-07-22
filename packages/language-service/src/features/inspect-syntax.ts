import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'
import { generateCSS } from '@master/css-language'

export default function inspectSyntax(this: CSSLanguageService, document: TextDocument, position: HoverParams['position']): Hover | undefined {
  const classPosition = this.getClassPosition(document, position)
  if (!classPosition) return
  const { token } = classPosition
  const range: Range = {
    start: document.positionAt(classPosition.range.start),
    end: document.positionAt(classPosition.range.end)
  }
  const rustInspection = this.analyzer?.inspectClassName?.(token)
  if (rustInspection) {
    const documentation = createCSSMarkdownDocumentation(rustInspection.text)
    if (!documentation) return
    return rustInspection.kind === 'component'
      ? {
        contents: {
          kind: documentation.kind,
          value: `(components) ` + documentation.value
        }
      }
      : { contents: documentation, range }
  }
  const utilities = this.css.generate(token)
  const component = utilities.find((utility) => utility.type === this.runtime.UtilityType.Semantic && utility.layerName === 'components')
  if (component) {
    const documentation = createCSSMarkdownDocumentation(generateCSS([token], this.css, this.runtime))
    if (documentation) {
      return {
        contents: {
          kind: documentation.kind,
          value: `(components) ` + documentation.value
        }
      }
    }
  } else {
    const utility = utilities[0]
    if (utility) {
      if (utility.type === this.runtime.UtilityType.Semantic) {
        const documentation = createCSSMarkdownDocumentation(generateCSS([token], this.css, this.runtime))
        if (documentation) {
          return {
            contents: documentation,
            range
          }
        }
      } else {
        const documentation = createCSSMarkdownDocumentation(generateCSS([token], this.css, this.runtime))
        if (documentation) {
          return {
            contents: documentation,
            range
          }
        }
      }
    }
  }
}
