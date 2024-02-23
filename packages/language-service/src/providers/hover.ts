import type { Hover, Range } from 'vscode-languageserver-types'
import { MasterCSS, Layer, Rule } from '@master/css'
import { getCssEntryMarkdownDescription } from '../utils/get-css-entry-markdown-description'
// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css'
// @ts-expect-error
import { cssData } from 'vscode-css-languageservice/lib/umd/data/webCustomData'
// @ts-expect-error
import { CSSDataProvider } from 'vscode-css-languageservice/lib/umd/languageFacts/dataProvider'

export function doHover(instance: string, range: Range, config?: any): Hover | null {

    const css = new MasterCSS(config)
    css.add(instance)

    const contents = []

    if (css.text) {
        const cssPreview = getCssPreview(css.text)
        if (cssPreview) {
            contents.push(cssPreview)
        }
    }

    if (css.rules.length > 0) {
        const cssHoverInfo = getCssHoverInfo(css.rules[0])
        if (cssHoverInfo) {
            contents.push(cssHoverInfo)
        }
    }

    return {
        contents,
        range: range
    }
}

function getCssPreview(renderText: string) {
    return {
        language: 'css',
        value: css_beautify(renderText, {
            newline_between_rules: true,
            end_with_newline: true
        })
    }
}

function getCssHoverInfo(rule: Rule) {
    const cssDataProvider = new CSSDataProvider(cssData)
    const cssProperties = cssDataProvider.provideProperties()

    let cssHoverInfo: any = null

    const fullKey = rule.id
    const originalCssProperty = cssProperties.find((x: { name: string }) => x.name == fullKey)
    if (rule?.layer && [Layer.Core, Layer.CoreNative, Layer.CoreShorthand, Layer.CoreNativeShorthand].includes(rule.layer) && originalCssProperty) {
        if (!originalCssProperty.references?.find((x: { name: string }) => x.name === 'Master Reference')) {
            originalCssProperty.references = [
                ...(originalCssProperty?.references ?? []),
                {
                    name: 'Master Reference',
                    url: `https://rc.css.master.co/docs/${fullKey}`
                }
            ]
        }
        cssHoverInfo = getCssEntryMarkdownDescription(originalCssProperty)
    }

    return cssHoverInfo
}