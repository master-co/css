import type { Hover, Range } from 'vscode-languageserver-types'
import MasterCSS from '@master/css'
import { css_beautify } from 'js-beautify/js/lib/beautify-css'
import { getCssEntryMarkdownDescription } from '../utils/get-css-entry-markdown-description'
import { masterCssKeyValues } from '../constant'
import { cssData } from 'vscode-css-languageservice/lib/umd/data/webCustomData'
import { CSSDataProvider } from 'vscode-css-languageservice/lib/umd/languageFacts/dataProvider'

export function doHover(instance: string, range: Range, config?: any): Hover | null {

    const contents = []

    const cssPreview = getCssPreview(instance, config)
    if (cssPreview) {
        contents.push(cssPreview)
    }

    const cssHoverInfo = getCssHoverInfo(instance)
    if (cssHoverInfo) {
        contents.push(cssHoverInfo)
    }

    return {
        contents,
        range: range
    }
}

function getCssPreview(syntax: string, config: any) {
    const css = new MasterCSS(config)
    css.add(syntax)
    const renderText = css.text
    if (!renderText || renderText == ' ') {
        return null
    }

    return {
        language: 'css',
        value: css_beautify(renderText, {
            newline_between_rules: true,
            end_with_newline: true
        })
    }
}

function getCssHoverInfo(instance: string) {
    const masterKey = instance.split(':')[0]
    const cssDataProvider = new CSSDataProvider(cssData)
    const cssProperties = cssDataProvider.provideProperties()

    let cssHoverInfo: any = null
    for (const masterCssKeyValue of masterCssKeyValues) {
        const fullKey = masterCssKeyValue.key[0]
        const originalCssProperty = cssProperties.find(x => x.name == fullKey)
        if (masterCssKeyValue.key.includes(masterKey) && originalCssProperty) {
            if (!originalCssProperty.references?.find(x => x.name === 'Master Reference')) {
                originalCssProperty.references = [
                    ...(originalCssProperty?.references ?? []),
                    {
                        name: 'Master Reference',
                        url: `https://beta.css.master.co/docs/${fullKey}`
                    }
                ]
            }
            cssHoverInfo = getCssEntryMarkdownDescription(originalCssProperty)
            break
        }
    }
    return cssHoverInfo
}