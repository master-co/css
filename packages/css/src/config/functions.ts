import type { Config } from '.'

const functions: Config['functions'] = {
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
            const functions = this.css.config.functions

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const instance = this
            let i = 0, newValue = '', current = '';
            (function anaylze(functionName: string, bypassHandlingUnitForcely: boolean) {
                let bypassHandlingUnit = false
                const clear = (char: string, addPrefixSpace = false, addSuffixSpace = false) => {
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

                    newValue += current
                        + ((addPrefixSpace && value[i - 1] !== ' ') ? ' ' : '')
                        + char
                        + ((addSuffixSpace && value[i + 1] !== ' ') ? ' ' : '')

                    current = ''
                    bypassHandlingUnit = false
                }

                for (; i < value.length; i++) {
                    const char = value[i]
                    if (char === '(') {
                        const newFunctionName = current
                        const originalBypassHandlingUnit = bypassHandlingUnit
                        const originalNewValueLength = newValue.length
                        clear(char)
                        i++
                        anaylze(newFunctionName, originalBypassHandlingUnit || bypassHandlingUnitForcely)

                        if (newFunctionName !== 'calc') {
                            const functionConfig = functions[newFunctionName]
                            if (functionConfig) {
                                const functionValue = newValue.slice(originalNewValueLength + 2, newValue.length - 1)
                                newValue = newValue.slice(0, originalNewValueLength - newFunctionName.length + 1)
                                    + (functionConfig.name ?? newFunctionName)
                                    + '('
                                    // @ts-ignore
                                    + (functionConfig.transform?.call(instance, functionValue) ?? functionValue)
                                    + ')'
                            }
                        }
                    } else if (char === ')') {
                        clear(char)
                        break
                    } else if (char === ',') {
                        clear(char, false, true)
                    } else if (char === ' ') {
                        clear(char)
                    } else {
                        const previousChar = value[i - 1]
                        switch (char) {
                            case '+':
                                if (!current && previousChar !== ')') {
                                    current += char
                                } else {
                                    clear(char, true, true)
                                }
                                break
                            case '-':
                                if (functionName === 'var' || !current && previousChar !== ')') {
                                    current += char
                                } else {
                                    clear(char, true, true)
                                }
                                break
                            case '*':
                                clear(char, true, true)
                                break
                            case '/':
                                clear(char, true, true)
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

export default functions