import type { Color, ColorInformation } from 'vscode-languageserver-types'
import { MasterCSS } from '@master/css'
import { hexToRgb } from '../utils/hex-to-rgb'
import { instancePattern } from '../utils/regex'
import { hsl, hwb, lch, lab, cmyk } from 'color-convert'
import { oklabToRgb } from '../utils/oklab-to-rgb'
import { oklchToOklab } from '../utils/oklch-to-oklab'
import MasterCSSLanguageService from '../core'
import { TextDocument } from 'vscode-languageserver-textdocument'

export default async function getSyntaxColorInfo(this: MasterCSSLanguageService, document: TextDocument): Promise<ColorInformation[] | undefined> {
    const text = document.getText() ?? ''
    if (typeof document == 'undefined') {
        return []
    }
    const colorIndexes: any[] = []
    let instanceMatch: RegExpExecArray | null
    while ((instanceMatch = instancePattern.exec(text)) !== null) {
        const instanceStartIndex = instanceMatch.index
        // todo: refactor theme
        // const theme = css.themeNames.find(x => instanceMatch?.[0]?.endsWith(`@${x}`)) ?? ''
        const theme = ''

        const colorPattern = /(?<=[|:\s"'`]|^)(?:#?[\w-]+(?:-[\d]{1,2})?(?:\/.?[\d]*)?(?:\([^\s)]+\))?(?![:]))/g
        let colorMatch: RegExpExecArray | null

        //check color
        while ((colorMatch = colorPattern.exec(instanceMatch[0])) !== null) {
            const colorValue = parseColorString(colorMatch[0], theme, this.css)
            if (colorValue) {
                const colorIndex: any = {
                    index: {
                        start: instanceStartIndex + colorMatch.index,
                        end: instanceStartIndex + colorMatch.index + colorMatch[0].length
                    },
                    color: colorValue
                }
                colorIndexes.push(colorIndex)
            }
        }
    }
    const colorIndexSet = new Set()
    const colorInformation = colorIndexes
        .filter(item => {
            if (colorIndexSet.has(item.index.start)) {
                return false
            } else {
                colorIndexSet.add(item.index.start)
                return true
            }
        })
        .map(x => ({
            range: {
                start: document.positionAt(x.index.start),
                end: document.positionAt(x.index.end)
            },
            color: x.color
        }))

    return colorInformation
}

function percentageConverter(value: string, max = 1) {
    if (value === 'none') {
        return 0
    }
    else if (value.endsWith('%')) {
        return max * Number(value.replace('%', '')) / 100
    }
    else {
        return Number(value)
    }
}

function degConverter(value: string) {
    if (value === 'none') {
        return 0
    }
    else if (value.endsWith('turn')) {
        return Number(value.replace('turn', '')) * 360
    }
    else if (value.endsWith('grad')) {
        return Number(value.replace('grad', '')) * 0.9
    }
    else if (value.endsWith('rad')) {
        return Number(value.replace('rad', '')) * 57.2957795
    }
    else if (value.endsWith('deg')) {
        return Number(value.replace('deg', ''))
    }
    else {
        return Number(value)
    }
}

function parseColorString(colorString: string, theme: string, css: MasterCSS = new MasterCSS()) {
    const rgbaColorPattern = /rgb(?:a)?\(([\d.]+)[,|]([\d.]+)[,|]([\d.]+)(?:[,/]([\d.]+(?:%)?))?\)/g
    const hslaColorPattern = /hsl(?:a)?\(([\d.]+(?:deg|turn|grad|rad)?|none)[,|]([\d.]+%|none)[,|]([\d.]+%|none)(?:[,/]([\d.]+(?:%)?))?\)/g
    const hwbColorPattern = /hwb\(([\d.]+(?:deg|turn|grad|rad)?|none)[|]([\d.]+%|none)[|]([\d.]+%|none)(?:[/]([\d.]+(?:%)?))?\)/g
    const oklchColorPattern = /oklch\(([\d.]+(?:%)?|none)[|]([\d.]+(?:%)?|none)[|]([\d.]+(?:deg|turn|grad|rad)?|none)(?:[/]([\d.]+(?:%)?))?\)/g
    const lchColorPattern = /lch\(([\d.]+(?:%)?|none)[|]([\d.]+(?:%)?|none)[|]([\d.]+(?:deg|turn|grad|rad)?|none)(?:[/]([\d.]+(?:%)?))?\)/g
    const oklabColorPattern = /oklab\(([\d.]+(?:%)?|none)[|](-?[\d.]+(?:%)?|none)[|](-?[\d.]+(?:%)?|none)(?:[/]([\d.]+(?:%)?))?\)/g
    const labColorPattern = /lab\(([\d.]+(?:%)?|none)[|](-?[\d.]+(?:%)?|none)[|](-?[\d.]+(?:%)?|none)(?:[/]([\d.]+(?:%)?))?\)/g
    const cmykColorPattern = /device-cmyk\(([\d.]+(?:%)?|none)[|]([\d.]+(?:%)?|none)[|]([\d.]+(?:%)?|none)[|]([\d.]+(?:%)?|none)(?:[/]([\d.]+(?:%)?))?(?:,\w+\(.*\))?\)/g
    const hexColorPattern = /#([0-9a-fA-F]{6,8})/g
    const colorFunctionPattern = /color?\((?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)[|]([\d.]+)[|]([\d.]+)[|]([\d.]+)(?:[/]([\d.]+(?:%)?))?\)/g

    let colorMatch2: RegExpExecArray | null
    //#region  for rgb、hls
    if ((colorMatch2 = rgbaColorPattern.exec(colorString))) {
        return getColorValue({ red: Number(colorMatch2[1]), green: Number(colorMatch2[2]), blue: Number(colorMatch2[3]), alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = hslaColorPattern.exec(colorString))) {
        const rgb = hsl.rgb([degConverter(colorMatch2[1]), percentageConverter(colorMatch2[2], 100), percentageConverter(colorMatch2[3], 100)])
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = hwbColorPattern.exec(colorString))) {
        const rgb = hwb.rgb([degConverter(colorMatch2[1]), percentageConverter(colorMatch2[2], 100), percentageConverter(colorMatch2[3], 100)])
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = oklchColorPattern.exec(colorString))) {
        const oklab = oklchToOklab([percentageConverter(colorMatch2[1]), percentageConverter(colorMatch2[2], 0.4), degConverter(colorMatch2[3])])
        const rgb = oklabToRgb(oklab)
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = lchColorPattern.exec(colorString))) {
        const rgb = lch.rgb([percentageConverter(colorMatch2[1], 100), percentageConverter(colorMatch2[2], 150), degConverter(colorMatch2[3])])
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = oklabColorPattern.exec(colorString))) {
        const rgb = oklabToRgb([percentageConverter(colorMatch2[1]), percentageConverter(colorMatch2[2], 0.4), percentageConverter(colorMatch2[3], 0.4)])
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = labColorPattern.exec(colorString))) {
        const rgb = lab.rgb([percentageConverter(colorMatch2[1], 100), percentageConverter(colorMatch2[2], 125), percentageConverter(colorMatch2[3], 125)])
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    else if ((colorMatch2 = cmykColorPattern.exec(colorString))) {
        const rgb = cmyk.rgb([percentageConverter(colorMatch2[1], 100), percentageConverter(colorMatch2[2], 100), percentageConverter(colorMatch2[3], 100), percentageConverter(colorMatch2[4], 100)])
        return getColorValue({ red: rgb[0], green: rgb[1], blue: rgb[2], alpha: colorMatch2[5] == undefined ? 1 : percentageConverter(colorMatch2[5]) })
    }
    else if ((colorMatch2 = hexColorPattern.exec(colorString))) {
        return getColorValue(hexToRgb(colorMatch2[1]))
    }
    else if ((colorMatch2 = colorFunctionPattern.exec(colorString))) {
        return getColorValue({ red: Number(colorMatch2[1]) * 255, green: Number(colorMatch2[2]) * 255, blue: Number(colorMatch2[3]) * 255, alpha: colorMatch2[4] == undefined ? 1 : percentageConverter(colorMatch2[4]) })
    }
    //#endregion for rgb、hls

    //#region for mastercss color
    let colorAlpha = 1
    let colorName = colorString
    const allCSSColorNames = []
    // todo: refactor css.variables
    for (const eachVariableName in css.variables) {
        const eachVariable = css.variables[eachVariableName]
        if (eachVariable.type === 'color')
            allCSSColorNames.push(eachVariableName)
    }
    if (colorString.split('/').length == 2) {
        colorAlpha = Number('0' + colorString.split('/')[1])
    }

    if (colorString.split('-').length == 1) { //:black  black/.5
        colorName = colorString.split('/')[0]
        colorName = colorName.endsWith('_') ? colorName.replace('_', '') : colorName
    }

    if (allCSSColorNames.find(x => x == colorName)) {
        return getColorsRGBA(colorName, colorAlpha, theme, css)
    }
    //#endregion  for mastercss color
}

function getColorsRGBA(colorName: string, colorAlpha = 1, theme = '', css: MasterCSS = new MasterCSS()): Color {
    try {
        // todo: refactor colorNumberMap
        const colorNumberMap: any = css.variables[colorName]
        const levelRgb = hexToRgb(colorNumberMap[theme] ?? colorNumberMap[''] ?? Object.values(colorNumberMap)[0])

        return { red: levelRgb.red / 255, green: levelRgb.green / 255, blue: levelRgb.blue / 255, alpha: colorAlpha }
    } catch (ex) {
        return { red: 0, green: 0, blue: 0, alpha: 1 }
    }
}


export function getColorValue(color: Color): Color {
    return { red: color.red / 255.0, green: color.green / 255.0, blue: color.blue / 255.0, alpha: color.alpha }
}