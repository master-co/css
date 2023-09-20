export function transformColorWithOpacity(color: string, opacityStr: string) {
    let opacity = opacityStr.endsWith('%')
        ? parseFloat(opacityStr) / 100.0
        : +opacityStr

    opacity = isNaN(opacity)
        ? 1
        : Math.min(Math.max(opacity, 0), 1)

    return color + Math.round(opacity * 255).toString(16).toUpperCase().padStart(2, '0')
}