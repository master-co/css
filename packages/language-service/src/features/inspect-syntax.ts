import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { getCSSDataDocumentation } from '../utils/get-css-data-documentation'
import { UtilityType, generateCSS, isCoreRule } from '../master-css'
import cssDataProvider from '../utils/css-data-provider'
import getUtilityInfo from '../utils/get-utility-info'

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
        const documentation = getCSSDataDocumentation({} as any, {
            generatedCSS: generateCSS([token], this.css),
            docs: '/guide/components'
        })
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
                const { data, docs } = getUtilityInfo(utility.registeredUtility, this.css)
                const documentation = getCSSDataDocumentation(data, {
                    generatedCSS: generateCSS([token], this.css),
                    docs
                })
                if (documentation) {
                    return {
                        contents: documentation,
                        range
                    }
                }
            } else {
                const nativeProperties = cssDataProvider.provideProperties()
                const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === utility.id)
                const documentation = getCSSDataDocumentation(nativeCSSPropertyData, {
                    generatedCSS: generateCSS([token], this.css),
                    docs: '/reference/' + (isCoreRule(utility.id) && utility.id)
                })
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
