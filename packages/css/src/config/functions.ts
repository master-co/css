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

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const instance = this
            let i = 0, newValue = '', current = '';
            (function anaylze(functionName: string, bypassHandlingUnitForcely: boolean) {
                let bypassHandlingUnit = false
                const clear = (char: string, prefix = '', suffix = '') => {
                    if (char !== '(') {
                        if (values && current in values) {
                            current = values[current].toString()
                        } else if (globalValues && current in globalValues) {
                            current = globalValues[current].toString()
                        }
                    }
    
                    if (current && !bypassHandlingUnit && !bypassHandlingUnitForcely) {
                        const result = instance.analyzeUnitValue(current, functions.calc.unit)
                        if (result) {
                            current = result.value + result.unit
                        }
                    }
    
                    newValue += current + prefix + char + suffix
    
                    current = ''
                    bypassHandlingUnit = false
                }

                for (;i < value.length; i++) {
                    const char = value[i]
                    if (char === '(') {
                        const newFunctionName = current
                        const originalBypassHandlingUnit = bypassHandlingUnit
                        clear(char)
                        i++
                        anaylze(newFunctionName, originalBypassHandlingUnit || bypassHandlingUnitForcely)
                    } else if (char === ')') {
                        clear(char)
                        break
                    } else if (char === ',') {
                        clear(char, '', ' ')
                    } else {
                        const previousChar = value[i - 1]
                        switch (char) {
                            case '+':
                                if (!current && previousChar !== ')') {
                                    current += char
                                } else {
                                    clear(char, ' ', ' ')
                                }
                                break
                            case '-':
                                if (functionName === 'var' || !current && previousChar !== ')') {
                                    current += char
                                } else {
                                    clear(char, ' ', ' ')
                                }
                                break
                            case '*':
                                clear(char, ' ', ' ')
                                break
                            case '/':
                                clear(char, ' ', ' ')
                                bypassHandlingUnit = true
                                break
                            default:
                                current += char
                                break
                        }
                    }
                }

                if (i >= value.length - 1) {
                    clear('')
                }
            })('', false)

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
