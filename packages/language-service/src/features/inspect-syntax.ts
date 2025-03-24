import type { Hover, HoverParams, Range } from 'vscode-languageserver-protocol'
import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { getCSSDataDocumentation } from '../utils/get-css-data-documentation'
import { Layer, SyntaxRuleType, generateCSS, isCoreRule } from '@master/css'
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
    const componentClasses = this.css.components.get(token)
    if (componentClasses) {
        const documentation = getCSSDataDocumentation({} as any, {
            generatedCSS: generateCSS([token], this.css),
            docs: '/guide/components'
        })
        if (documentation) {
            return {
                contents: {
                    kind: documentation.kind,
                    value: `(style) ` + componentClasses.join(' ') + '\n' + documentation.value
                }
            }
        }
    } else {
        const rules = this.css.generate(token)
        const rule = rules[0]
        if (rule) {
            if (rule.type === SyntaxRuleType.Utility) {
                const { data, docs } = getUtilityInfo(rule.registeredSyntax, this.css)
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
                const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === rule.id)
                const documentation = getCSSDataDocumentation(nativeCSSPropertyData, {
                    generatedCSS: generateCSS([token], this.css),
                    docs: '/reference/' + (isCoreRule(rule.id) && rule.id)
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
