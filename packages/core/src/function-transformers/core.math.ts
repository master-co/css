import { Utility } from '../utility'
import { StringValueComponent } from '../types/syntax'
import functions from '../config/functions'
import { BASE_UNIT_REGEX } from '../common'

interface CoreMathData {
    name?: string
    wrapArguments?: boolean
}

function splitTopLevelArguments(value: string) {
    const parts: string[] = []
    let depth = 0
    let start = 0
    for (let i = 0; i < value.length; i++) {
        const char = value[i]
        if (char === '(') {
            depth++
        } else if (char === ')') {
            depth--
        } else if (char === ',' && depth === 0) {
            parts.push(value.slice(start, i), char)
            start = i + 1
        }
    }
    parts.push(value.slice(start))
    return parts
}

function hasTopLevelOperator(value: string) {
    let depth = 0
    for (let i = 0; i < value.length; i++) {
        const char = value[i]
        if (char === '(') {
            depth++
        } else if (char === ')') {
            depth--
        } else if (depth === 0 && (char === '+' || char === '-' || char === '*' || char === '/')) {
            let previousIndex = i - 1
            while (value[previousIndex] === ' ') {
                previousIndex--
            }
            const previousChar = value[previousIndex]
            if ((char === '+' || char === '-') && (!previousChar || previousChar === '(' || previousChar === ',' || previousChar === ' ')) {
                continue
            }
            return true
        }
    }
    return false
}

function wrapCalcArguments(value: string) {
    return splitTopLevelArguments(value).map((part) => {
        if (part === ',') return part
        const trimmed = part.trim()
        if (!trimmed || /^(?:calc|clamp|min|max|var)\(/.test(trimmed) || !hasTopLevelOperator(trimmed)) {
            return part
        }
        const leadingWhitespace = part.match(/^\s*/)![0]
        const trailingWhitespace = part.match(/\s*$/)![0]
        return `${leadingWhitespace}calc(${trimmed})${trailingWhitespace}`
    }).join('')
}

export default function coreMath(this: Utility, value: string, bypassVariableNames: string[], data?: CoreMathData) {
    const functionName = data?.name ?? 'calc'
    const valueComponents: Utility['valueComponents'] = []
    let i = 0

    const anaylzeDeeply = (
        currentValueComponents: Utility['valueComponents'],
        bypassHandlingSeparator: boolean,
        parentBypassParsing: boolean,
        parentUnitChecking: boolean,
        isVarFunction: boolean
    ) => {
        const isChildHandler = valueComponents !== currentValueComponents
        const unparsedValueComponents: StringValueComponent[] = []
        let bypassParsing = false
        let hasUnit = false
        let currentHasUnit = false
        let unitChecking = false
        let childHasUnit: boolean | undefined = undefined
        let current = ''
        const clear = (separator: string, prefix = '', suffix = '') => {
            if (childHasUnit === false && separator !== ' ' && this.definition.unit) {
                childHasUnit = undefined
                if (!unitChecking) {
                    pushUnitValueComponents()
                }
            }

            if (current) {
                if (!isVarFunction) {
                    const result = BASE_UNIT_REGEX.exec(current)
                    if (result) {
                        current = (+result[1] * (this.css.config.baseUnit ?? 1)).toString()
                    }
                }

                if (!bypassParsing && !parentBypassParsing) {
                    const valueComponent = { ...this.parseValue(current), token: current }
                    if (
                        !hasUnit
                        && isNaN(+current)
                        && valueComponent.type === 'number'
                    ) {
                        hasUnit = true
                    }

                    if (unitChecking) {
                        if (isNaN(+current)) {
                            if (valueComponent.type === 'number') {
                                currentValueComponents.push(valueComponent)
                                currentHasUnit = true
                            } else {
                                currentValueComponents.push(valueComponent)
                            }
                        } else {
                            currentValueComponents.push({ type: 'number', value: +current, token: current })
                        }
                    } else {
                        if (isChildHandler) {
                            const newValueComponent = { type: 'string', value: current, token: current } as const
                            unparsedValueComponents.push(newValueComponent)
                            currentValueComponents.push(newValueComponent)
                        } else {
                            currentValueComponents.push(valueComponent)
                        }
                    }
                } else {
                    currentValueComponents.push({ type: 'string', value: current, token: current })
                }

                current = ''
            }

            if (separator) {
                if (separator === '+' || separator === '-') {
                    handleUnitChecking()
                }

                if (prefix && value[i - 1] === ' ') {
                    prefix = ''
                }
                if (suffix && value[i + 1] === ' ') {
                    suffix = ''
                }
                if (bypassHandlingSeparator) {
                    currentValueComponents.push({ type: 'separator', value: separator, text: separator, token: separator })
                } else {
                    currentValueComponents.push({ type: 'separator', value: separator, text: prefix + separator + suffix, token: separator })
                }
            }
            bypassParsing = false
        }
        const pushUnitValueComponents = () => {
            if (this.definition.unit === 'rem' || this.definition.unit === 'em') {
                currentValueComponents.push(
                    { type: 'separator', value: '/', text: ' / ', token: '/' },
                    { type: 'number', value: this.css.config.rootSize as number, token: String(this.css.config.rootSize) }
                )
            }
            currentValueComponents.push(
                { type: 'separator', value: '*', text: ' * ', token: '*' },
                { type: 'number', value: 1, unit: this.definition.unit, token: this.definition.unit }
            )
        }
        const handleUnitChecking = () => {
            if (unitChecking && !currentHasUnit && !parentUnitChecking && (!isChildHandler || hasUnit)) {
                pushUnitValueComponents()
            }
            unitChecking = false
            currentHasUnit = false
        }

        for (; i < value.length; i++) {
            const char = value[i]
            if (char === '(') {
                const symbolResult = /^([+-])/.exec(current)
                if (symbolResult) {
                    currentValueComponents.push({ type: 'string', value: symbolResult[1], token: symbolResult[1] })
                }
                const functionName = symbolResult ? current.slice(1) : current
                const newValueComponent: Utility['valueComponents'][0] = {
                    type: 'function', name: functionName, symbol: char, children: [], bypassTransform: functionName === 'calc', token: current
                }
                currentValueComponents.push(newValueComponent)
                current = ''
                i++
                const isVarFunction = functionName === '$' || functionName === 'var'
                childHasUnit = anaylzeDeeply(
                    newValueComponent.children,
                    functionName !== ''
                    && functionName !== 'calc'
                    && (
                        isVarFunction
                        || Object.prototype.hasOwnProperty.call(functions, functionName)
                    ),
                    bypassParsing || isVarFunction || unitChecking && currentHasUnit,
                    unitChecking,
                    isVarFunction
                ) || functionName === 'var'
                if (!childHasUnit && functionName === '$') {
                    const variableType = this.css.variables.get((newValueComponent.children[0] as StringValueComponent).value)?.type
                    childHasUnit = !variableType || variableType === 'string'
                }
                if (childHasUnit) {
                    hasUnit = true
                    currentHasUnit = true
                }
            } else if (char === ')') {
                clear('')
                if (hasUnit) {
                    for (const eachUnparsedValueComponent of unparsedValueComponents) {
                        Object.assign(eachUnparsedValueComponent, this.parseValue(eachUnparsedValueComponent.value))
                    }
                }
                return hasUnit
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
                        if (this.definition.unit) {
                            unitChecking = true
                        }
                        clear(char, ' ', ' ')
                        break
                    case '/':
                        if (this.definition.unit) {
                            unitChecking = true
                        }
                        clear(char, ' ', ' ')
                        bypassParsing = true
                        break
                    default:
                        current += char
                        break
                }
            }
        }
        clear('')
        handleUnitChecking()
    }
    anaylzeDeeply(valueComponents, false, false, false, false)

    let resolvedValue = this.resolveValue(valueComponents, this.definition.unit, bypassVariableNames, true)
    if (data?.wrapArguments) {
        resolvedValue = wrapCalcArguments(resolvedValue)
    }
    return functionName + '(' + resolvedValue + ')'
}
