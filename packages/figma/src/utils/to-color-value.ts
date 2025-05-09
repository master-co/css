import Color from 'colorjs.io'
import { RGBA } from './parse-color-value'

export default function toColorValue(rgba: RGBA, space = 'hex'): string {
    const color = new Color('srgb', [rgba.r, rgba.g, rgba.b], rgba.a)
    switch (space) {
        case 'rgb':
            return color.to('srgb').toString({ format: 'css', precision: 2, inGamut: false })
        case 'hsl':
            return color.to('hsl').toString({ format: 'css', precision: 2, inGamut: false })
        case 'lab':
            return color.to('lab').toString({ format: 'css', precision: 2, inGamut: false })
        case 'oklab':
            return color.to('oklab').toString({ format: 'css', precision: 4, inGamut: false })
        case 'oklch':
            return color.to('oklch').toString({ format: 'css', precision: 4, inGamut: false })
        case 'display-p3':
            return color.to('display-p3').toString({ format: 'css', precision: 4, inGamut: false })
        default:
            return color.to('srgb').toString({ format: 'hex', inGamut: false }) // auto includes alpha if needed
    }
}