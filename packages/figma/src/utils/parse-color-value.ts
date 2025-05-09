import Color from 'colorjs.io'

export interface RGBA {
    r: number
    g: number
    b: number
    a: number
}

export default function parseColorValue(input: string): RGBA {
    const color = new Color(input)
    const [r, g, b] = color.to('srgb').coords
    const a = color.alpha ?? 1
    return { r, g, b, a }
}