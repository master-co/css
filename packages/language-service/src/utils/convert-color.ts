import convert from 'color-convert'
// @ts-expect-error
import ColorSpace from 'color-space'

export default function convertColor(color: any, targetSpace: any) {
    let colorToken
    const { red, green, blue } = color
    const alpha = color.alpha !== undefined ? color.alpha : 1
    const alphaToken = alpha >= 0 && alpha < 1 ? `/${alpha}` : ''
    switch (targetSpace) {
        case 'hex':
            colorToken = `#${convert.rgb.hex([red, green, blue])}${alpha >= 0 && alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : ''}`.toLocaleLowerCase()
            break
        case 'rgba':
        case 'rgb':
            colorToken = `rgb(${red}|${green}|${blue}${alphaToken})`
            break
        case 'hsla':
        case 'hsl':
            const hsl = convert.rgb.hsl([red, green, blue])
            colorToken = `hsl(${hsl[0]}|${hsl[1]}%|${hsl[2]}%${alphaToken}))`
            break
        case 'hwb':
            const hwb = convert.rgb.hwb([red, green, blue])
            colorToken = `hwb(${hwb[0]}|${hwb[1]}%|${hwb[2]}%${alphaToken})`
            break
        case 'lab':
            const lab = ColorSpace.rgb.lab([red, green, blue])
            colorToken = `lab(${lab[0]}%|${lab[1]}|${lab[2]}${alphaToken})`
            break
        case 'lch':
            const lch = ColorSpace.rgb.lch([red, green, blue])
            colorToken = `lch(${lch[0]}%|${lch[1]}|${lch[2]}${alphaToken})`
            break
        case 'oklab':
            const oklab = ColorSpace.rgb.oklab([red, green, blue]).concat(alpha)
            colorToken = `oklab(${oklab[0]}%|${oklab[1]}|${oklab[2]}${alphaToken})`
            break
        case 'oklch':
            const oklch = ColorSpace.rgb.oklch([red, green, blue]).concat(alpha)
            colorToken = `oklch(${oklch[0]}%|${oklch[1]}|${oklch[2]}${alphaToken})`
            break
        default:
            console.log('Unsupported color space', targetSpace)
    }
    return colorToken
}
