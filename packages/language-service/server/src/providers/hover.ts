import type { Hover } from 'vscode-languageserver/node'
import type { Range } from 'vscode-languageserver-textdocument'
import MasterCSS, { render } from '@master/css'
import { css_beautify } from 'js-beautify'
import { getDefaultCSSDataProvider } from 'vscode-css-languageservice'
import { getCssEntryMarkdownDescription } from '../utils/get-css-entry-markdown-description'
import { masterCssKeyValues } from '../constant'

export function doHover(instance: string, range: Range, masterCss: MasterCSS = new MasterCSS({ observe: false })): Hover | null {
    
    const contents = []

    const cssPreview = getCssPreview(instance, masterCss)
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

function getCssPreview(instance: string, masterCss: MasterCSS = new MasterCSS({ observe: false })) {
    const renderText = render(instance.split(' '), masterCss.config)
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
    const cssDataProvider = getDefaultCSSDataProvider()
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