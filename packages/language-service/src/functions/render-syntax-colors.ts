import type { ColorInformation } from 'vscode-languageserver-types'
import { instancePattern } from '../utils/regex'
import MasterCSSLanguageService from '../core'
import { TextDocument } from 'vscode-languageserver-textdocument'
import toRGBA from 'color-rgba'
import { Layer } from '@master/css'

export default async function renderSyntaxColors(this: MasterCSSLanguageService, document: TextDocument): Promise<ColorInformation[] | undefined> {
    const text = document.getText() ?? ''
    const colorInformations: ColorInformation[] = []
    const isRGBAValid = (rgba: number[]) => rgba.filter(x => isNaN(x)).length === 0

    for (const instanceMatch of text.matchAll(instancePattern)) {
        if (instanceMatch.index === undefined) break
        const instanceStartIndex = instanceMatch.index
        const syntax = instanceMatch[0]
        const rule = this.css.generate(syntax)[0]
        if (rule && rule.layer !== Layer.Semantic) {
            const prefixLenght = rule.keyToken?.length || 0
            let currentTextLength = prefixLenght
            for (const valueComponent of rule.valueComponents) {
                if (valueComponent.text === undefined) return  // text is always existing, just for type
                console.log(valueComponent.token)
                currentTextLength += valueComponent.token.length || 0
                // TODO: check number mt:30
                switch (valueComponent.type) {
                    default:
                        // convert any color channel string to rgba: [red, green, blue, alpha]
                        const rgba = toRGBA(valueComponent.text)
                        // check if rgba is valid
                        if (rgba?.length && isRGBAValid(rgba)) {
                            colorInformations.push({
                                range: {
                                    start: document.positionAt(instanceStartIndex + prefixLenght),
                                    end: document.positionAt(instanceStartIndex + currentTextLength)
                                },
                                color: { red: rgba[0] / 255, green: rgba[1] / 255, blue: rgba[2] / 255, alpha: rgba[3] }
                            })
                        }
                        break
                }
            }
        }
    }

    const colorIndexSet = new Set()
    return colorInformations.filter(item => {
        if (colorIndexSet.has(item.range.start)) {
            return false
        } else {
            colorIndexSet.add(item.range.start)
            return true
        }
    })
}
