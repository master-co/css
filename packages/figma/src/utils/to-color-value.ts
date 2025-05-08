import Color from 'colorjs.io'

export interface RGBA {
    r: number
    g: number
    b: number
    a: number
}

export default function toColorValue(rgba: RGBA, space = 'hex'): string {
    const color = new Color('srgb', [rgba.r, rgba.g, rgba.b], rgba.a)
    switch (space) {
        case 'rgb':
            return color.to('srgb').toString({ format: 'css', precision: 2 })
        case 'hsl':
            return color.to('hsl').toString({ format: 'css', precision: 2 })
        case 'lab':
            return color.to('lab').toString({ format: 'css', precision: 2 })
        case 'oklab':
            return color.to('oklab').toString({ format: 'css', precision: 4 })
        case 'oklch':
            return color.to('oklch').toString({ format: 'css', precision: 4 })
        case 'display-p3':
            return color.to('display-p3').toString({ format: 'css', precision: 4 })
        case 'hex':
        default:
            return color.to('srgb').toString({ format: 'hex' }) // auto includes alpha if needed
    }
}