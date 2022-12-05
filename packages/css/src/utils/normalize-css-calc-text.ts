import { analyzeUnitValue } from './analyze-unit-value'

/**
 * 將 calc( 正規化
 * https://aoyue.notion.site/css-calc-2f37632c5cf749949cc060f0f2111443
 */
export function normalizeCssCalcText(value: string, rootSize: number, defaultUnit: string) {
    const isOperator = (char: string) => char === '+' || char === '-' || char === '*' || char === '/'

    let newValue = '', type: 1 | 2, current = '', endWithBracket = false, withUnit = false
    function clear(char: string, prefix = '', suffix = '') {
        if (type === 2 && !withUnit) {
            const result = analyzeUnitValue(current, rootSize, defaultUnit)
            if (result) {
                current = result.value + result.unit
            }
        }
        newValue += current + prefix + char + suffix

        type = null
        withUnit = false
        current = ''
    }

    for (let i = 0; i < value.length; i++) {
        const char = value[i]

        if (char === '(' || char === ')') {
            endWithBracket = char === ')'
            clear(char)
        } else if (char === ',') {
            clear(char, '', ' ')
        } else {
            switch (type) {
                // 字串
                case 1:
                    break
                // 數字
                case 2:
                    if (isOperator(char)) {
                        clear(char, ' ', ' ')
                        continue
                    } else if (!/[0-9]/.test(char)) {
                        withUnit = true
                    }
                    break
                default:
                    if (endWithBracket) {
                        newValue += ' '
                    }

                    if (!isNaN(+char)) {
                        type = 2
                    } else if (!isOperator(char)) {
                        type = 1
                    }
                    break
            }

            if (type) {
                current += char
            } else {
                newValue += char
            }
        }
    }

    if (current) {
        newValue += current
    }

    return newValue
}