import { Rule } from '../rule'

export const functions: Record<string, FunctionConfig> = {
    $: {
        name: 'var',
        transform(value) {
            return '--' + value
        }
    },
    calc: {
        transform(value) {
            const isOperator = (char: string) => char === '+' || char === '-' || char === '*' || char === '/'

            let newValue = '', type: 1 | 2, current = '', endWithBracket = false, withUnit = false
            const clear = (char: string, prefix = '', suffix = '') => {
                if (type === 2 && !withUnit) {
                    const result = this.analyzeUnitValue(current, functions.calc.unit)
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

            clear('')

            return newValue
        }
    },
    translate: { unit: 'rem' },
    translateX: { unit: 'rem' },
    translateY: { unit: 'rem' },
    translateZ: { unit: 'rem' },
    translate3d: { unit: 'rem' },
    skew: { unit: 'deg' },
    skewX: { unit: 'deg' },
    skewY: { unit: 'deg' },
    skewZ: { unit: 'deg' },
    skew3d: { unit: 'deg' },
    rotate: { unit: 'deg' },
    rotateX: { unit: 'deg' },
    rotateY: { unit: 'deg' },
    rotateZ: { unit: 'deg' },
    rotate3d: { unit: 'deg' },
    blur: { unit: 'rem' },
    'drop-shadow': { unit: 'rem' },
    'hue-rotate': { unit: 'deg' },
    rgb: { unit: '' },
    rgba: { unit: '' },
    hsl: { unit: '' },
    hsla: { unit: '' }
}

export interface FunctionConfig {
    unit?: string
    name?: string
    transform?(this: Rule, value: string): string
}
