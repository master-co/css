import convertColorSpace from './convert-color-space'
import type { MasterCSS } from '@master/css'
import { ColorPresentationParams } from 'vscode-languageserver'

export default function convertColorByToken(color: ColorPresentationParams['color'], colorToken: string, css: MasterCSS) {
    const valueComponent = css.generate('color:' + colorToken)[0]?.valueComponents[0]
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
    return convertColorSpace({ r: color.red, g: color.green, b: color.blue, alpha: color.alpha, mode: 'rgb' }, outputColorSpace)
}