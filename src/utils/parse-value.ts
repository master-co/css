import { normalizeCssCalcText } from './normalize-css-calc-text'

const UNIT_VALUE_PATTERN = /^([+-.]?\d+(\.?\d+)?)(.*)?/
const VAR_START = 'var(--'

export function parseValue(
    token: string | number,
    defaultUnit?: string,
    colorsThemesMap?: Record<string, Record<string, Record<string, string>>>,
    values?: Record<string, string | number>,
    globalValues?: Record<string, string | number>,
    rootSize?: number,
    themes?: string[]
): {
    value: string,
    unit: string,
    unitToken: string,
    colorMatched?: boolean
} {
    let value: any = ''
    let unit = ''
    let unitToken = ''
    let colorMatched: boolean = undefined 

    const newValue = (values && token in values)
        ? values[token]
        : (globalValues && token in globalValues)
            ? globalValues[token]
            : ''
    if (newValue) {
        if (!defaultUnit)
            return { value: newValue.toString(), unit, unitToken }

        token = newValue
    }

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
        if (defaultUnit) {
            const matches = token.match(UNIT_VALUE_PATTERN)
            // ['0.5deg', '0.5', 'deg', index: 0, input: '0.5deg', groups: undefined]
            if (matches) {
                if (token.includes('/')) {
                    // w:1/2 -> width: 50%
                    const splits = token.split('/')
                    return { value: (+splits[0] / +splits[1]) * 100 + '%', unit, unitToken }
                } else {
                    value = +matches[1]
                    unit = unitToken = matches[3] || ''
                    /**
                     * 當無單位值且 defaultUnit === 'rem'，
                     * 將 pxValue / 16 轉為 remValue
                     */
                    if (!unit) {
                        if (defaultUnit === 'rem' || defaultUnit === 'em') {
                            value = value / rootSize
                        }
                        unit = defaultUnit || ''
                    }
                    return { value, unit, unitToken }
                }
            }
        }
        value = (token.indexOf('calc(') === -1
            ? token
            : normalizeCssCalcText(token))
            .replace(/\$\(((\w|-)+)\)/g, VAR_START + '$1)')
    }
    return { value, unit, unitToken, colorMatched }
}