import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import createCSSMarkdownDocumentation from '../utils/create-css-markdown-documentation'
import { UtilityType, generateCSS } from '../master-css'

export default function inspectSyntax(this: CSSLanguageService, document: TextDocument, position: HoverParams['position']): Hover | undefined {
    const classPosition = this.getClassPosition(document, position)
    if (!classPosition) return
    const { token } = classPosition
    const range: Range = {
        start: document.positionAt(classPosition.range.start),
        end: document.positionAt(classPosition.range.end)
    }
    const utilities = this.css.generate(token)
    const component = utilities.find((utility) => utility.type === UtilityType.Static && utility.layerName === 'components')
    if (component) {
        const documentation = createCSSMarkdownDocumentation(generateCSS([token], this.css))
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
            if (utility.type === UtilityType.Static) {
                const documentation = createCSSMarkdownDocumentation(generateCSS([token], this.css))
                if (documentation) {
                    return {
                        contents: documentation,
                        range
                    }
                }
            } else {
                const documentation = createCSSMarkdownDocumentation(generateCSS([token], this.css))
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
