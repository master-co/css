import type { MasterCSS, ColorVariable } from '@master/css'
import type { ColorPresentationParams } from 'vscode-languageserver-protocol'
import Color from 'colorjs.io'

export default function convertColorByToken(color: ColorPresentationParams['color'], colorToken: string, css: MasterCSS) {
    const valueComponent = css.generate('color:' + colorToken)[0]?.valueComponents[0]
    let outputSpace = 'srgb'
    switch (valueComponent?.type) {
        case 'function':
            outputSpace = valueComponent.name
            break
        case 'variable':
            outputSpace = (valueComponent.variable as ColorVariable)?.space
            break
        case 'string':
            outputSpace = 'srgb'
            break
    }
    outputSpace = normalizeCSSColorFunctionName(outputSpace)
    if (!outputSpace) {
        return
    }
    return new Color({ space: 'srgb', coords: [color.red, color.green, color.blue], alpha: color.alpha }).to(outputSpace).toString({ format: 'css', precision: 4, inGamut: false })
        .replace(' / ', '/')
        .replaceAll(' ', '|')
}

export function normalizeCSSColorFunctionName(fn: string): string {
    switch (fn) {
        case 'rgb':
        case 'rgba':
            return 'srgb'
        case 'hsla':
            return 'hsl'
        case 'display-p3':
        case 'p3':
            return 'p3'
        case 'rec2020':
        case 'rec.2020':
            return 'rec2020'
        case 'color':
            return ''
        default:
            return fn
    }
}
