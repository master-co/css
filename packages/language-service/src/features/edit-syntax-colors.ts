import type { TextDocument } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../core'
import type { ColorPresentationParams, ColorPresentation } from 'vscode-languageserver-protocol'
import convertColorByToken from '../utils/convert-color-token'

export default function editSyntaxColors(
    this: CSSLanguageService,
    document: TextDocument,
    color: ColorPresentationParams['color'],
    range: ColorPresentationParams['range']
) {
    const colorPresentations: ColorPresentation[] = []
    const selectedColorToken = document.getText(range)
    const targetColorToken = convertColorByToken(color, selectedColorToken, this.css)
    if (targetColorToken)
        colorPresentations.push({ label: targetColorToken, textEdit: { range, newText: targetColorToken } })
    return colorPresentations
}