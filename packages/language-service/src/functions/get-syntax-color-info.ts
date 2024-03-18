import type { Color, ColorInformation } from 'vscode-languageserver-types'
import { instancePattern } from '../utils/regex'
import MasterCSSLanguageService from '../core'
import { TextDocument } from 'vscode-languageserver-textdocument'
import toRGBA from 'color-rgba'

export default async function getSyntaxColorInfo(this: MasterCSSLanguageService, document: TextDocument): Promise<ColorInformation[]> {
    const text = document.getText() ?? ''
    const colorInformations: ColorInformation[] = []
    let instanceMatch: RegExpExecArray | null
    while ((instanceMatch = instancePattern.exec(text)) !== null) {
        const instanceStartIndex = instanceMatch.index
        let colorMatch: RegExpExecArray | null
        let target: string
        let rgba: number[] | undefined
        const colorPattern = /(?<=[|:\s"'`]|^)(?:#?[\w-]+(?:-[\d]{1,2})?(?:\/.?[\d]*)?(?:\([^\s)]+\))?(?![:]))/g
        while ((colorMatch = colorPattern.exec(instanceMatch[0])) !== null) {
            // replace any | with space
            // target = colorMatch[0].replace(/\|/g, ' ')
            // convert any color channel string to rgba: [red, green, blue, alpha]
            rgba = toRGBA(target)
            // check if rgba is valid
            if (rgba?.length && rgba.filter(x => isNaN(x)).length === 0) {
                colorInformations.push({
                    range: {
                        start: document.positionAt(instanceStartIndex + colorMatch.index),
                        end: document.positionAt(instanceStartIndex + colorMatch.index + target.length)
                    },
                    color: { red: rgba[0], green: rgba[1], blue: rgba[2], alpha: rgba[3] }
                })
            }
        }
    }
    const colorIndexSet = new Set()
    return colorInformations
        .filter(item => {
            if (colorIndexSet.has(item.range.start)) {
                return false
            } else {
                colorIndexSet.add(item.range.start)
                return true
            }
        })
}