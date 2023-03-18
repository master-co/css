export function parseRuleValue(
    token: string | number,
    defaultUnit?: string,
    colorNames?: string[],
    colorThemesMap?: Record<string, Record<string, string>>,
    rootSize?: number,
    themes?: string[]
): {
    value: string,
    unit: string,
    colorMatched?: boolean
} {
    let value: any = ''
    let unit = ''
    let colorMatched: boolean = undefined

    if (typeof token === 'number') {
        value = token
        unit = defaultUnit || ''
    } else {
        if (colorThemesMap) {
            let anyMatched = false
            let hasColorName = false

            token = token.replace(
                new RegExp(`(^|,| |\\()((?:${colorNames.join('|')})(?:-(?:[0-9A-Za-z-]+))?)(?:\\/(\\.?[0-9]+%?))?(?=(\\)|\\}|,| |$))`, 'gm'),
                (origin, prefix, colorName, opacityStr) => {
                    hasColorName = true

                    const themeColorMap = colorThemesMap[colorName]
                    if (themeColorMap) {
                        let color: string
                        for (const eachTheme of themes) {
                            if ((color = themeColorMap[eachTheme]))
                                break
                        }

                        if (color) {
                            anyMatched = true

                            let newValue = color
                            if (opacityStr) {
                                let opacity = opacityStr.endsWith('%')
                                    ? parseFloat(opacityStr) / 100.0
                                    : +opacityStr

                                opacity = isNaN(opacity)
                                    ? 1
                                    : Math.min(Math.max(opacity, 0), 1)

                                newValue += Math.round(opacity * 255).toString(16).toUpperCase().padStart(2, '0')
                            }

                            return prefix + newValue
                        }
                    }

                    return origin
                })

            if (hasColorName) {
                colorMatched = anyMatched
            }
        }

        value = token
    }
    return { value, unit, colorMatched }
}