import { TextDocument } from 'vscode-languageserver-textdocument'
import MasterCSSLanguageService from '../core'
import { ColorPresentation } from 'vscode-languageserver-types'
import { ColorPresentationParams } from 'vscode-languageserver/node'
import convertColor from '../utils/convert-color'

export default function editSyntaxColors(
    this: MasterCSSLanguageService,
    document: TextDocument,
    color: ColorPresentationParams['color'],
    range: ColorPresentationParams['range']
) {
    const colorPresentations: ColorPresentation[] = []
    const selectedColorToken = document.getText(range)
    const valueComponent = this.css.generate('color:' + selectedColorToken)[0]?.valueComponents[0]
    let outputColorSpace = 'hex'
    switch (valueComponent?.type) {
        case 'function':
            outputColorSpace = valueComponent.name
            break
        case 'variable':
            outputColorSpace = valueComponent.variable?.space
            break
        case 'string':
            outputColorSpace = 'hex'
            break
    }
    console.log(color)
    console.log(valueComponent)
    const outputColorToken = convertColor({
        red: Math.round(color.red * 255),
        green: Math.round(color.green * 255),
        blue: Math.round(color.blue * 255),
        alpha: color.alpha
    }, outputColorSpace)
    if (outputColorToken)
        colorPresentations.push({ label: outputColorToken, textEdit: { range, newText: outputColorToken } })
    return colorPresentations
}