import type { ColorInformation } from 'vscode-languageserver-types'
import { instancePattern } from '../utils/regex'
import MasterCSSLanguageService from '../core'
import { TextDocument } from 'vscode-languageserver-textdocument'
import toRGBA from 'color-rgba'
import { Layer, ValueComponent } from '@master/css'

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
            const keyTokenLength = rule.keyToken.length
            let currentLength = 0
            const resolveValueComponent = (valueComponent: ValueComponent) => {
                if (valueComponent.text === undefined) return  // text is always existing, just for type
                const startOffset = instanceStartIndex + keyTokenLength + currentLength
                // TODO: check number mt:30
                const valueComponentTokenLength = valueComponent.token.length
                let rgba: number[] | undefined
                switch (valueComponent.type) {
                    case 'function':
                        if (['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'].includes(valueComponent.name)) {
                            rgba = toRGBA(valueComponent.text)
                        } else if (valueComponent.children.length) {
                            currentLength += valueComponent.name.length + 1 // function name + '('
                            valueComponent.children.forEach(resolveValueComponent)
                        }
                        break
                    case 'variable':
                    case 'string':
                        if (valueComponent.text !== '#') {
                            rgba = toRGBA(valueComponent.text)
                        }
                }
                // check if rgba is valid
                if (rgba?.length && isRGBAValid(rgba)) {
                    colorInformations.push({
                        range: {
                            start: document.positionAt(startOffset),
                            end: document.positionAt(startOffset + valueComponentTokenLength)
                        },
                        color: { red: rgba[0] / 255, green: rgba[1] / 255, blue: rgba[2] / 255, alpha: rgba[3] }
                    })
                }
                currentLength += valueComponentTokenLength || 0
            }
            rule.valueComponents.forEach(resolveValueComponent)
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
