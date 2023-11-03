import type { Config, ConfigFunction } from './'
import type { Rule } from '../rule'

const functions = {
    $: {
        transform(value) {
            return [{ type: 'variable', name: value }]
        }
    },
    calc: {
        transform(value, bypassVariableNames) {
            const valueComponents: Rule['valueComponents'] = []
            const functions = this.css.config.functions
            let i = 0
            const anaylze = (currentValueComponents: Rule['valueComponents'], bypassHandlingSeparator: boolean, bypassHandlingUnitForcely: boolean) => {
                let bypassHandlingUnit = false
                let current = ''
                const clear = (separator: string, prefix = '', suffix = '') => {
                    if (current) {
                        if (!bypassHandlingUnit && !bypassHandlingUnitForcely) {
                            currentValueComponents.push(this.parseValueComponent(current, functions.calc.unit))
                        } else {
                            currentValueComponents.push({ type: 'string', value: current })
                        }
                        current = ''
                    }
                    if (separator) {
                        if (prefix && value[i - 1] === ' ') {
                            prefix = ''
                        }
                        if (suffix && value[i + 1] === ' ') {
                            suffix = ''
                        }
                        if (bypassHandlingSeparator) {
                            currentValueComponents.push({ type: 'separator', value: separator })
                        } else {
                            currentValueComponents.push({ type: 'separator', value: separator, prefix, suffix })
                        }
                    }
                    bypassHandlingUnit = false
                }

                for (; i < value.length; i++) {
                    const char = value[i]
                    if (char === '(') {
                        const symbolResult = /^([+-])/.exec(current)
                        if (symbolResult) {
                            currentValueComponents.push({ type: 'string', value: symbolResult[1] })
                        }
                        const functionName = symbolResult ? current.slice(1) : current
                        const newValueComponent: Rule['valueComponents'][0] = { type: 'function', name: functionName, symbol: char, childrens: [] }
                        currentValueComponents.push(newValueComponent)
                        current = ''
                        i++
                        const isVarFunction = newValueComponent.name === '$' || newValueComponent.name === 'var'
                        anaylze(
                            newValueComponent.childrens,
                            functionName !== ''
                            && functionName !== 'calc'
                            && (
                                isVarFunction
                                || Object.prototype.hasOwnProperty.call(functions, functionName)
                            ),
                            bypassHandlingUnit || isVarFunction
                        )
                    } else if (char === ')') {
                        clear('')
                        break
                    } else if (char === ',') {
                        clear(char, '', ' ')
                    } else if (char === ' ') {
                        clear(char)
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
                                if (!current && previousChar !== ')') {
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
                clear('')
            }
            anaylze(valueComponents, false, false)

            return 'calc(' + this.transformValueComponents(valueComponents, functions.calc.unit ?? this.options.unit, bypassVariableNames) + ')'
        }
    } as ConfigFunction,
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
    color: { unit: '', colored: true },
    'color-contrast': { unit: '', colored: true },
    'color-mix': { unit: '', colored: true },
    hwb: { unit: '' },
    lab: { unit: '' },
    lch: { unit: '' },
    oklab: { unit: '' },
    oklch: { unit: '' },
    clamp: { unit: '' },
    repeat: { unit: '' },
    'linear-gradient': { colored: true },
    'radial-gradient': { colored: true },
    'conic-gradient': { colored: true },
    'repeating-linear-gradient': { colored: true },
    'repeating-radial-gradient': { colored: true },
    'repeating-conic-gradient': { colored: true }
}

export default functions