import { analyzeUnitValue } from './analyze-unit-value'
import { normalizeCssCalcText } from './normalize-css-calc-text'

export function parseValue(
    token: string | number,
    defaultUnit?: string,
    colorsThemesMap?: Record<string, Record<string, Record<string, string>>>,
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
        if (colorsThemesMap) {
            const colorNames = Object.keys(colorsThemesMap)
            let anyMatched = false
            let hasColorName = false
            
            token = token.replace(
                new RegExp(`(^|,| |\\()(${colorNames.join('|')})(?:-([0-9A-Za-z]+))?(?:\\/(\\.?[0-9]+%?))?(?=(\\)|\\}|,| |$))`, 'gm'),
                (origin, prefix, colorName, level, opacityStr) => {
                    hasColorName = true

                    const themeHexColorMap =  colorsThemesMap[colorName]?.[level || '']
                    if (themeHexColorMap) {
                        let hexColor: string
                        for (const eachTheme of themes) {
                            if ((hexColor = themeHexColorMap[eachTheme]))
                                break
                        }

                        if (hexColor) {
                            anyMatched = true

                            let newValue = hexColor
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

        const result = analyzeUnitValue(token, rootSize, defaultUnit)
        if (result)
            return result

        value = (token.indexOf('calc(') === -1
            ? token
            : normalizeCssCalcText(token, rootSize, defaultUnit))
            .replace(/\$\(((\w|-)+)\)/g, 'var(--$1)')
    }
    return { value, unit, colorMatched }
}