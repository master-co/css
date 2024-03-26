import type { Hover, HoverParams, Range } from 'vscode-languageserver'
import { Layer, generateCSS } from '@master/css'
import { getCSSDataDocumentation } from '../utils/get-css-data-documentation'
import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import cssDataProvider from '../utils/css-data-provider'
import beautifyCSS from '../utils/beautify-css'

export default function inspectSyntax(this: CSSLanguageService, document: TextDocument, position: HoverParams['position']): Hover | undefined {
    const checkResult = this.getClassPosition(document, position)
    if (!checkResult) return
    const syntax = checkResult.token
    const range: Range = {
        start: document.positionAt(checkResult.range.start),
        end: document.positionAt(checkResult.range.end)
    }
    const rules = this.css.generate(syntax)
    const rule = rules[0]
    const contents = []
    if (rule) {
        const text = generateCSS([syntax], this.css)
        if (text)
            /* preview the generated css */
            contents.push({
                language: 'css',
                value: beautifyCSS(text)
            })
        /* reference and info about the syntax */
        const cssProperties = cssDataProvider.provideProperties()
        let cssHoverInfo: any = null
        const fullKey = rule.id
        const originalCssProperty = cssProperties.find((x: { name: string }) => x.name == fullKey)
        if (rule.layer && [Layer.Core, Layer.CoreNative, Layer.CoreShorthand, Layer.CoreNativeShorthand].includes(rule.layer) && originalCssProperty) {
            if (!originalCssProperty.references?.find((x: { name: string }) => x.name === 'Master CSS')) {
                originalCssProperty.references = [
                    {
                        name: 'Master CSS',
                        url: `https://rc.css.master.co/docs/${fullKey}`
                    },
                    ...(originalCssProperty?.references ?? []),
                ]
            }
            cssHoverInfo = getCSSDataDocumentation(originalCssProperty)?.value
        }
        if (cssHoverInfo) {
            contents.push(cssHoverInfo)
        }
        return { contents, range }
    }
}
