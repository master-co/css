import { TextDocument } from 'vscode-languageserver-textdocument'
import MasterCSSLanguageService from '../core'
import { ColorPresentation } from 'vscode-languageserver-types'
import { ColorPresentationParams } from 'vscode-languageserver/node'
import { toTwoDigitHex } from '../utils/to-two-digit-hex'
import { rgb } from 'color-convert'

export default function getSyntaxColorPresentation(
    this: MasterCSSLanguageService,
    document: TextDocument,
    color: ColorPresentationParams['color'],
    range: ColorPresentationParams['range']
) {
    if (this.settings.renderSyntaxColors && this.isDocAllowed(document)) {
        let label
        const result: ColorPresentation[] = []
        const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255)
        const text = document.getText()
        const positionIndex = document.offsetAt(range.start) ?? 0
        const startIndex = document.offsetAt({ line: range.start.line - 100, character: 0 }) ?? 0
        const endIndex = document.offsetAt({ line: range.start.line + 100, character: 0 }) ?? undefined
        const checkResult = this.getPosition(text.substring(startIndex, endIndex), positionIndex, startIndex, ['(?<=colors:\\s*{\\s*.*)([^}]*)}'])
        if (checkResult) {
            if (color.alpha === 1) {
                label = `'#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`
            } else {
                label = `'#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`
            }
            result.push({ label, textEdit: { range, newText: label } })
            return result
        }
        if (color.alpha === 1) {
            label = `rgb(${red256},${green256},${blue256})`
        } else {
            label = `rgba(${red256},${green256},${blue256},${color.alpha})`
        }
        result.push({ label, textEdit: { range, newText: label } })

        if (color.alpha === 1) {
            label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`
        } else {
            label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`
        }
        result.push({ label, textEdit: { range, newText: label } })

        const hsl = rgb.hsl(red256, green256, blue256)
        if (color.alpha === 1) {
            label = `hsl(${hsl[0]},${Math.round(hsl[1])}%,${Math.round(hsl[2])}%)`
        } else {
            label = `hsla(${hsl[0]},${Math.round(hsl[1])}%,${Math.round(hsl[2])}%,${color.alpha})`
        }
        result.push({ label, textEdit: { range, newText: label } })
        return result
    }
}