import { serializeHex, serializeHex8, formatCss, type Rgb, modeLch, modeHsl, modeLab, modeHwb, modeOklab, modeOklch } from 'culori'

export default function convertColorSpace(rgb: Rgb, targetSpace: any): string | undefined {
    const alphaUsed = rgb.alpha !== 1
    const alphaToken = alphaUsed ? `/${rgb.alpha}` : ''
    if (rgb.r === 0 && rgb.g === 0 && rgb.b === 0) return 'black' + alphaToken
    if (rgb.r === 1 && rgb.g === 1 && rgb.b === 1) return 'white' + alphaToken
    switch (targetSpace) {
        case 'hex':
            return alphaUsed ? serializeHex8(rgb) : serializeHex(rgb)
        case 'rgba':
        case 'rgb':
            return `rgb(${Math.round(rgb.r * 255)}|${Math.round(rgb.g * 255)}|${Math.round(rgb.b * 255)}${alphaToken})`
        case 'hsla':
        case 'hsl':
            const hsl = modeHsl.fromMode.rgb(rgb)
            return `hsl(${Math.round(hsl.h || 0)}|${Math.round(hsl.s * 100)}%|${Math.round(hsl.l * 100)}%${alphaToken})`
        case 'hwb':
            const hwb = modeHwb.fromMode.rgb(rgb)
            return `hwb(${Math.round(hwb.h || 0)}|${Math.round(hwb.w * 100)}%|${Math.round(hwb.b * 100)}%${alphaToken})`
        case 'lab':
            const lab = modeLab.fromMode.rgb(rgb)
            return `lab(${Math.round(lab.l)}%|${Math.round(lab.a)}|${Math.round(lab.b || 0)}${alphaToken})`
        case 'lch':
            const lch = modeLch.fromMode.rgb(rgb)
            return `lch(${Math.round(lch.l)}%|${Math.round(lch.c)}|${Math.round(lch.h || 0)}${alphaToken})`
        case 'oklab':
            const oklab = modeOklab.fromMode.rgb(rgb)
            return `oklab(${Math.round(oklab.l * 100)}%|${oklab.a.toFixed(4)}|${oklab.b.toFixed(4)}${alphaToken})`
        case 'oklch':
            const oklch = modeOklch.fromMode.rgb(rgb)
            return `oklch(${Math.round(oklch.l * 100)}%|${oklch.c.toFixed(4)}|${Math.round(oklch.h || 0)}${alphaToken})`
    }
    // color()
    return formatCss(rgb)
        .replace(' / ', '/')
        .replace(' ', '|')
}
