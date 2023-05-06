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
            const values = this.values
            const globalValues = this.css.globalValues

            let newValue = '', type: 1 | 2, current = '', withUnit = false, functionName = '', isFirstChar = true
            const clear = (char: string, prefix = '', suffix = '') => {
                if (type === 2 && !withUnit) {
                    const result = this.analyzeUnitValue(current, functions.calc.unit)
                    if (result) {
                        current = result.value + result.unit
                    }
                }

                if (char !== '(') {
                    if (values && current in values) {
                        current = values[current].toString()
                    } else if (globalValues && current in globalValues) {
                        current = globalValues[current].toString()
                    }
                } else {
                    functionName = current
                }

                if (char === ')') {
                    functionName = ''
                }

                newValue += current + prefix + char + suffix

                type = null
                withUnit = false
                current = ''
            }

            for (let i = 0; i < value.length; i++) {
                const char = value[i]
                if (char === '(' || char === ')') {
                    clear(char)
                    isFirstChar = true
                    continue
                } else if (char === ',') {
                    clear(char, '', ' ')
                } else if (char === '-' && type !== 1) {
                    const previousValue = value[i - 1]
                    if (previousValue === '(') {
                        newValue += char
                    } else if (previousValue === ')') {
                        clear(char, ' ', ' ')
                    } else if (isNaN(+value[i + 1])) {
                        if (previousValue === '-') {
                            clear(char)
                            type = 1
                        } else {
                            clear(char, isFirstChar ? '' : ' ', isFirstChar ? '' : ' ')
                        }
                    } else {
                        clear(char, current ? ' ' : '', current ? ' ' : '')
                    }
                } else if (char === '+' || char === '*' || char === '/' || functionName !== 'var' && char === '-') {
                    clear(char, ' ', ' ')
                } else {
                    switch (type) {
                        // 字串
                        case 1:
                            break
                        // 數字
                        case 2:
                            if (char !== '.' && !/[0-9]/.test(char)) {
                                withUnit = true
                            }
                            break
                        default:
                            type = isNaN(+char)
                                ? 1
                                : 2
                    }

                    if (type) {
                        current += char
                    } else {
                        newValue += char
                    }
                }

                isFirstChar = false
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
    hsla: { unit: '' },
    repeat: { unit: '' }
}

export interface FunctionConfig {
    unit?: string
    name?: string
    transform?(this: Rule, value: string): string
}
