export default function hexToRgb(hex: string) {
    if (hex.startsWith('#')) {
        hex = hex.slice(1)
    }

    let r: number | undefined
    let g: number | undefined
    let b: number | undefined
    let a: number | undefined
    if (hex.length === 3 || hex.length === 4) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
        a = (hex.length === 4) ? Math.round(parseInt(hex[3] + hex[3], 16) / 255 * 100) / 100 : 1
    } else if (hex.length === 6 || hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
        a = (hex.length === 8) ? Math.round(parseInt(hex.slice(6, 8), 16) / 255 * 100) / 100 : 1
    }

    return [r, g, b, a]
}