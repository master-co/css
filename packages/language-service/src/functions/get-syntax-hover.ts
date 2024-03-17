import type { Hover, Range } from 'vscode-languageserver-types'
import { Layer } from '@master/css'
import { getCssEntryMarkdownDescription } from '../utils/get-css-entry-markdown-description'
// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css'
// @ts-expect-error
import { cssData } from 'vscode-css-languageservice/lib/umd/data/webCustomData'
// @ts-expect-error
import { CSSDataProvider } from 'vscode-css-languageservice/lib/umd/languageFacts/dataProvider'
import type MasterCSSLanguageService from '../core'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'

export default function getSyntaxHover(this: MasterCSSLanguageService, document: TextDocument, position: Position): Hover | undefined {
    if (this.settings.inspectSyntax && this.isDocAllowed(document)) {
        const text = document.getText()
        const positionIndex = document.offsetAt(position) ?? 0
        const startIndex = document.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
        const endIndex = document.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
        const checkResult = this.getPosition(text.substring(startIndex, endIndex), positionIndex, startIndex)
        if (!checkResult) return
        const syntax = checkResult.instanceContent
        const range: Range = {
            start: document.positionAt(checkResult.index.start),
            end: document.positionAt(checkResult.index.end)
        }
        const rules = this.css.generate(syntax)
        const contents = []

        if (rules.length) {
            /* preview the generated css of the syntax */
            const generatedCSS = rules.map((eachRule) => eachRule.text).join('')
            contents.push({
                language: 'css',
                value: css_beautify(generatedCSS, {
                    newline_between_rules: true,
                    end_with_newline: true
                })
            })

            /* reference and info about the syntax */
            const cssDataProvider = new CSSDataProvider(cssData)
            const cssProperties = cssDataProvider.provideProperties()
            let cssHoverInfo: any = null
            const fullKey = rules[0].id
            const originalCssProperty = cssProperties.find((x: { name: string }) => x.name == fullKey)
            if (rules[0].layer && [Layer.Core, Layer.CoreNative, Layer.CoreShorthand, Layer.CoreNativeShorthand].includes(rules[0].layer) && originalCssProperty) {
                if (!originalCssProperty.references?.find((x: { name: string }) => x.name === 'Reference')) {
                    originalCssProperty.references = [
                        {
                            name: 'Reference',
                            url: `https://rc.css.master.co/docs/${fullKey}`
                        },
                        ...(originalCssProperty?.references ?? []),
                    ]
                }
                cssHoverInfo = getCssEntryMarkdownDescription(originalCssProperty)
            }
            if (cssHoverInfo) {
                contents.push(cssHoverInfo)
            }
        }
        return { contents, range }
    }
}
