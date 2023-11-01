import type { Rule } from '../rule'

const functions = {
    $: {
        transform(opening, value, closing) {
            const variable = Object.prototype.hasOwnProperty.call(this.options.resolvedNormalVariables, value)
                ? this.options.resolvedNormalVariables[value]
                : (this.colored && Object.prototype.hasOwnProperty.call(this.options.resolvedColorVariables, value))
                    ? this.options.resolvedColorVariables[value]
                    : Object.prototype.hasOwnProperty.call(this.css.generalVariables, value)
                        ? this.css.generalVariables[value]
                        : (this.colored && Object.prototype.hasOwnProperty.call(this.css.colorVariables, value))
                            ? this.css.colorVariables[value]
                            : undefined
            if (variable) {
                const keys = Object.keys(variable)
                if (keys.some(eachKey => eachKey === '' || eachKey.startsWith('@'))) {
                    const variableName = variable.name ?? value
                    if (!this.variableNames) {
                        this.variableNames = []
                    }
                    if (!this.variableNames.includes(variableName)) {
                        this.variableNames.push(variableName)
                    }

                    return (variable[keys[0]].type === 'number' && this.options.unit)
                        ? `calc(var(--${variableName}) / 16 * 1rem)`
                        : 'var(--' + variableName + ')'
                } else {
                    return variable.value
                }
            } else {
                return 'var(--' + value + ')'
            }
        }
    },
    calc: {
        transform(opening, value, closing) {
            const valueNodes: Rule['valueNodes'] = []
            const functions = this.css.config.functions

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const instance = this
            let i = 0;
            (function anaylze(currentValueNodes: Rule['valueNodes'], bypassHandlingSeparator: boolean, bypassHandlingUnitForcely: boolean) {
                let bypassHandlingUnit = false
                let current = ''
                const clear = (separator: string, prefixWhite = false, suffixWhite = false) => {
                    if (current) {
                        if (!bypassHandlingUnit && !bypassHandlingUnitForcely) {
                            const uv = instance.resolveUnitValue(current, functions.calc.unit)
                            if (uv) {
                                current = uv.value + uv.unit
                            }
                        }

                        currentValueNodes.push(current)

                        current = ''
                    }

                    if (separator) {
                        if (prefixWhite && value[i - 1] === ' ') {
                            prefixWhite = false
                        }
                        if (suffixWhite && value[i + 1] === ' ') {
                            suffixWhite = false
                        }

                        if (bypassHandlingSeparator) {
                            currentValueNodes.push(separator)
                        } else {
                            currentValueNodes.push({ type: 'separator', value: separator, prefixWhite, suffixWhite })
                        }
                    }

                    bypassHandlingUnit = false
                }

                for (; i < value.length; i++) {
                    const char = value[i]
                    if (char === '(') {
                        const symbolResult = /^([+-])/.exec(current)
                        if (symbolResult) {
                            currentValueNodes.push(symbolResult[1])
                        }

                        const functionName = symbolResult ? current.slice(1) : current
                        const newValueNode: Rule['valueNodes'][0] = { type: 'function', name: functionName, symbol: char, childrens: [] }
                        currentValueNodes.push(newValueNode)
                        current = ''

                        i++
                        const isVarFunction = newValueNode.name === '$' || newValueNode.name === 'var'
                        anaylze(
                            newValueNode.childrens,
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
                                if (!current && previousChar !== ')') {
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

                clear('')
            })(valueNodes, false, false)

            return ['calc(', ...valueNodes, ')']
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