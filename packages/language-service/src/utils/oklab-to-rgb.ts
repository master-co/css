
export function oklabToRgb([L, a, b]: any): any {
    let l = L + a * +0.3963377774 + b * +0.2158037573
    let m = L + a * -0.1055613458 + b * -0.0638541728
    let s = L + a * -0.0894841775 + b * -1.2914855480

    l = l ** 3; m = m ** 3; s = s ** 3
    let red = l * +4.0767416621 + m * -3.3077115913 + s * +0.2309699292
    let green = l * -1.2684380046 + m * +2.6097574011 + s * -0.3413193965
    let blue = l * -0.0041960863 + m * -0.7034186147 + s * +1.7076147010

    red = 255 * linearToGamma(red)
    green = 255 * linearToGamma(green)
    blue = 255 * linearToGamma(blue)

    red = clamp(red, 0, 255)
    green = clamp(green, 0, 255)
    blue = clamp(blue, 0, 255)

    red = Math.round(red)
    green = Math.round(green)
    blue = Math.round(blue)

    return [red, green, blue]
}

function clamp(value: number, min: number, max: number) {
    return Math.max(Math.min(value, max), min)
}

const linearToGamma = (c: number) => c >= 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c