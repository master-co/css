import type { ColorInformation } from 'vscode-languageserver-protocol'
import { instancePattern } from '../utils/regex'
import CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import Color from 'colorjs.io'
import { UtilityType, type ValueComponent, type Variable } from '../master-css'

function resolveVariableColorValue(variable: Variable | undefined, variables: Map<string, Variable>): string | undefined {
    let current = variable
    for (let i = 0; i < 8; i++) {
        const value = current?.value
        if (value === undefined) return
        const text = String(value)
        const alias = /^\$([a-zA-Z0-9-]+)(?: ?\/ ?.+?)?$|^var\(--([_a-zA-Z0-9-]+)\)$/.exec(text)
        const aliasName = alias?.[1] ?? alias?.[2]
        if (!aliasName) return text
        current = variables.get(aliasName)
    }
}

export default async function renderSyntaxColors(this: CSSLanguageService, document: TextDocument): Promise<ColorInformation[] | undefined> {
    const text = document.getText() ?? ''
    const colorInformations: ColorInformation[] = []
    try {
        for (const instanceMatch of text.matchAll(instancePattern)) {
            if (instanceMatch.index === undefined) break
            const instanceStartIndex = instanceMatch.index
            const syntax = instanceMatch[0]
            const rule = this.css.generate(syntax)[0]
            if (rule && rule.type !== UtilityType.Static) {
                const keyTokenLength = rule.keyToken?.length ?? 0
                let currentLength = 0
                const resolveValueComponent = (valueComponent: ValueComponent) => {
                    if (valueComponent.text === undefined) return  // text is always existing, just for type
                    const startOffset = instanceStartIndex + keyTokenLength + currentLength
                    // TODO: check number mt:1.875rem
                    const valueComponentTokenLength = valueComponent.token.length
                    let color: Color | undefined
                    switch (valueComponent.type) {
                        case 'function':
                            if (['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'].includes(valueComponent.name)) {
                                color = new Color(valueComponent.text)
                            } else if (valueComponent.children.length) {
                                currentLength += valueComponent.name.length + 1 // function name + '('
                                valueComponent.children.forEach(resolveValueComponent)
                            }
                            break
                        case 'variable':
                            if (valueComponent.variable?.namespace?.startsWith('color') && valueComponent.variable.value !== undefined) {
                                color = new Color(resolveVariableColorValue(valueComponent.variable, this.css.variables) || String(valueComponent.variable.value))
                                if (valueComponent.alpha !== undefined) {
                                    color.alpha *= valueComponent.alpha
                                }
                            }
                            break
                        case 'string':
                            if (valueComponent.text !== '#' && valueComponent.text?.startsWith('#')) {
                                color = new Color(valueComponent.text)
                            }
                            break
                    }
                    // check if rgba is valid
                    if (color) {
                        const rgbaColor = color.to('srgb')
                        colorInformations.push({
                            range: {
                                start: document.positionAt(startOffset),
                                end: document.positionAt(startOffset + valueComponentTokenLength)
                            },
                            color: {
                                red: rgbaColor.r ?? 0,
                                green: rgbaColor.g ?? 0,
                                blue: rgbaColor.b ?? 0,
                                alpha: Number(rgbaColor.alpha)
                            }
                        })
                    }
                    currentLength += valueComponentTokenLength || 0
                }
                rule.valueComponents.forEach(resolveValueComponent)
            }
        }
    } catch (e) { }
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
