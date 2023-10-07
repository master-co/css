import type { Color, ColorPresentation } from 'vscode-languageserver-types'
import { MasterCSS } from '@master/css'
import { hexToRgb } from '../utils/hex-to-rgb'
import { instancePattern } from '../utils/regex'
import { toTwoDigitHex } from '../utils/to-two-digit-hex'
import { rgb, hsl, hwb, lch, lab, cmyk } from 'color-convert'
import { oklabToRgb } from '../utils/oklab-to-rgb'
import { oklchToOklab } from '../utils/oklch-to-oklab'

export async function getDocumentColors(text: string, css: MasterCSS = new MasterCSS()
): Promise<any[]> {
    const colors: any[] = []

    let instanceMatch: RegExpExecArray | null
    while ((instanceMatch = instancePattern.exec(text)) !== null) {
        const instanceStartIndex = instanceMatch.index
        const theme = css.themeNames.find(x => instanceMatch?.[0]?.endsWith(`@${x}`)) ?? ''

        const colorPattern = /(?<=[|:\s"'`]|^)(?:#?[\w-]+(?:-[\d]{1,2})?(?:\/.?[\d]*)?(?:\([^\s)]+\))?(?![:]))/g
        let colorMatch: RegExpExecArray | null

        //check color
        while ((colorMatch = colorPattern.exec(instanceMatch[0])) !== null) {
            const colorValue = parseColorString(colorMatch[0], theme, css)
            if (colorValue) {
                const colorIndex: any = {
                    index: {
                        start: instanceStartIndex + colorMatch.index,
                        end: instanceStartIndex + colorMatch.index + colorMatch[0].length
                    },
                    color: colorValue
                }
                colors.push(colorIndex)
            }
        }
    }


    return colors
}

function percentageConverter (value: string, max = 1) {
    if (value === 'none'){
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
    const allMasterCssColorKeys = Object.keys(css.colors)
    if (colorString.split('/').length == 2) {
        colorAlpha = Number('0' + colorString.split('/')[1])
    }

    if (colorString.split('-').length == 1) { //:black  black/.5
        colorName = colorString.split('/')[0]
        colorName = colorName.endsWith('_') ? colorName.replace('_', '') : colorName
    }

    if (allMasterCssColorKeys.find(x => x == colorName)) {
        return getColorsRGBA(colorName, colorAlpha, theme, css)
    }
    //#endregion  for mastercss color
}

function getColorsRGBA(colorName: string, colorAlpha = 1, theme = '', css: MasterCSS = new MasterCSS()): Color {
    try {
        const colorNumberMap = css.colors[colorName]
        const levelRgb = hexToRgb(colorNumberMap[theme] ?? colorNumberMap[''] ?? Object.values(colorNumberMap)[0])

        return { red: levelRgb.red / 255, green: levelRgb.green / 255, blue: levelRgb.blue / 255, alpha: colorAlpha }
    } catch (ex) {
        return { red: 0, green: 0, blue: 0, alpha: 1 }
    }
}


export function getColorValue(color: Color): Color {
    return { red: color.red / 255.0, green: color.green / 255.0, blue: color.blue / 255.0, alpha: color.alpha }
}

export function getColorPresentation(params: any, isColorRender = false) {
    const result: ColorPresentation[] = []
    const color = params.color
    const range = params.range


    const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255)

    let label

    if (isColorRender) {
        if (color.alpha === 1) {
            label = `'#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`
        } else {
            label = `'#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`
        }
        result.push({ label: label, textEdit: { range: range, newText: label } })
        return result
    }

    if (color.alpha === 1) {
        label = `rgb(${red256},${green256},${blue256})`
    } else {
        label = `rgba(${red256},${green256},${blue256},${color.alpha})`
    }
    result.push({ label: label, textEdit: { range: range, newText: label } })

    if (color.alpha === 1) {
        label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`
    } else {
        label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`
    }
    result.push({ label: label, textEdit: { range: range, newText: label } })

    const hsl = rgb.hsl(red256, green256, blue256)
    if (color.alpha === 1) {
        label = `hsl(${hsl[0]},${Math.round(hsl[1])}%,${Math.round(hsl[2])}%)`
    } else {
        label = `hsla(${hsl[0]},${Math.round(hsl[1])}%,${Math.round(hsl[2])}%,${color.alpha})`
    }
    result.push({ label: label, textEdit: { range: range, newText: label } })

    // const hwb = rgb.hwb(red256, green256, blue256)
    // if (color.alpha === 1) {
    //     label = `hwb(${hwb[0]}|${hwb[1]}%|${hwb[2]}%)`
    // } else {
    //     label = `hwb(${hwb[0]}|${hwb[1]}%|${hwb[2]}%/${color.alpha})`
    // }
    // result.push({ label: label, textEdit: { range: range, newText: label } })

    // const lab = rgb.lab(red256, green256, blue256)
    // if (color.alpha === 1) {
    //     label = `lab(${lab[0]}%|${lab[1]}|${lab[2]})`
    // } else {
    //     label = `lab(${lab[0]}%|${lab[1]}|${lab[2]}/${color.alpha})`
    // }
    // result.push({ label: label, textEdit: { range: range, newText: label } })

    // const lch = rgb.lch(red256, green256, blue256)
    // if (color.alpha === 1) {
    //     label = `lch(${lch[0]}%|${lch[1]}|${lch[2]})`
    // } else {
    //     label = `lch(${lch[0]}%|${lch[1]}|${lch[2]}/${color.alpha})`
    // }
    // result.push({ label: label, textEdit: { range: range, newText: label } })

    // const cmyk = rgb.cmyk(red256, green256, blue256)
    // if (color.alpha === 1) {
    //     label = `device-cmyk(${cmyk[0]}%|${cmyk[1]}%|${cmyk[2]}%|${cmyk[3]}%)`
    // } else {
    //     label = `device-cmyk(${cmyk[0]}%|${cmyk[1]}%|${cmyk[2]}%|${cmyk[3]}%/${color.alpha})`
    // }
    // result.push({ label: label, textEdit: { range: range, newText: label } })

    return result
}