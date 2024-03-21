import type { Hover, Range } from 'vscode-languageserver'
import { Layer } from '@master/css'
import { getCssEntryMarkdownDescription } from '../utils/get-css-entry-markdown-description'
// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css'
// @ts-expect-error
import { cssData } from 'vscode-css-languageservice/lib/umd/data/webCustomData'
// @ts-expect-error
import { CSSDataProvider } from 'vscode-css-languageservice/lib/umd/languageFacts/dataProvider'
import type CSSLanguageService from '../core'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'

export default function inspectSyntax(this: CSSLanguageService, document: TextDocument, position: Position): Hover | undefined {
    const checkResult = this.getPosition(document, position)
    if (!checkResult) return
    const syntax = checkResult.instanceContent
    const range: Range = {
        start: document.positionAt(checkResult.index.start),
        end: document.positionAt(checkResult.index.end)
    }
    const rules = this.css.generate(syntax)
    const css = new MasterCSS(this.config)
    css.add(syntax)
    const rule = rules[0]
    const contents = []
    if (rule) {
        /* preview the generated css */
        contents.push({
            language: 'css',
            value: css_beautify(css.text, {
                newline_between_rules: false,
                indent_size: 2
            })
        })
        /* reference and info about the syntax */
        const cssDataProvider = new CSSDataProvider(cssData)
        const cssProperties = cssDataProvider.provideProperties()
        let cssHoverInfo: any = null
        const fullKey = rule.id
        const originalCssProperty = cssProperties.find((x: { name: string }) => x.name == fullKey)
        if (rule.layer && [Layer.Core, Layer.CoreNative, Layer.CoreShorthand, Layer.CoreNativeShorthand].includes(rule.layer) && originalCssProperty) {
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
