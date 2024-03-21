import type { TextDocument } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../core'
import type { ColorPresentationParams, ColorPresentation } from 'vscode-languageserver'
import convertColor from '../utils/convert-color'

export default function editSyntaxColors(
    this: CSSLanguageService,
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
    const outputColorToken = convertColor({
        r: color.red,
        g: color.green,
        b: color.blue,
        alpha: color.alpha,
        mode: 'rgb'
    }, outputColorSpace)
    if (outputColorToken)
        colorPresentations.push({ label: outputColorToken, textEdit: { range, newText: outputColorToken } })
    return colorPresentations
}