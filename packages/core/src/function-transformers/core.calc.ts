import { SyntaxRule } from '../syntax-rule'
import { StringValueComponent } from '../types/syntax'
import functions from '../config/functions'
import { BASE_UNIT_REGEX } from '../common'

export default function coreCalc(this: SyntaxRule, value: string, bypassVariableNames: string[]) {
    const valueComponents: SyntaxRule['valueComponents'] = []
    let i = 0

    const anaylzeDeeply = (
        currentValueComponents: SyntaxRule['valueComponents'],
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
                const newValueComponent: SyntaxRule['valueComponents'][0] = {
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
    return 'calc(' + this.resolveValue(valueComponents, this.definition.unit, bypassVariableNames, true) + ')'
}