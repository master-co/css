/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import MasterCSS from './core'
import cssEscape from 'shared/utils/css-escape'
import SyntaxRuleType from './syntax-rule-type'
import { type PropertiesHyphen } from 'csstype'
import { VALUE_DELIMITERS, BASE_UNIT_REGEX, AT_IDENTIFIERS } from './common'
import Layer from './layer'
import type { ColorVariable, NumberValueComponent, DefinedRule, ValueComponent, VariableValueComponent, Variable } from './types/syntax'
import { AtRuleNode, AtRuleStringNode, AtRuleValueNode, } from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseAt from './utils/parse-at'
import { AtIdentifier } from './types/config'
import generateAt from './utils/generate-at'
import parseSelector, { SelectorNode } from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import { calcRulePriority, RulePriority } from './utils/compare-rule-priority'
import { SyntaxRuleTypeValue } from './types/common'
import declarers from './declarers'

export class SyntaxRule {
    native?: CSSRule
    readonly atRules?: Partial<Record<AtIdentifier, AtRuleNode[]>>
    readonly priority!: RulePriority
    readonly type: SyntaxRuleTypeValue = SyntaxRuleType.Normal
    readonly declarations?: PropertiesHyphen
    readonly layer: Layer
    readonly valid: boolean = true
    animationNames?: Set<string>
    variableNames?: Set<string>
    constructor(
        public readonly name: string,
        public css: MasterCSS,
        public readonly registeredSyntax: DefinedRule,
        public fixedClass?: string,
        mode?: string
    ) {
        this.mode = mode as string
        this.layer = css.generalLayer
        Object.assign(this, registeredSyntax)
        const { id, definition } = registeredSyntax
        const { analyze, transformValue, declarer, transformValueComponents, create, type, unit } = definition
        this.type = type!

        if (create) create.call(this, name)

        // 1. value / selectorToken
        let stateToken: string

        if (this.type === SyntaxRuleType.Utility) {
            // TODO: id 使用其他方式傳遞
            stateToken = name.slice(id.length - 1)
        } else {
            let valueToken: string
            if (analyze) {
                [valueToken] = analyze.call(this, name)
            } else {
                const indexOfColon = name.indexOf(':')
                this.keyToken = name.slice(0, indexOfColon + 1)
                valueToken = name.slice(indexOfColon + 1)
            }
            this.valueComponents = []
            const parsedValueIndex = this.parseValues(this.valueComponents, 0, valueToken, unit, '', undefined, false,
                definition.includeAnimations ? Array.from(this.css.animations.keys()) : []
            )
            this.valueToken = valueToken.slice(0, parsedValueIndex)
            stateToken = valueToken.slice(parsedValueIndex)
        }

        // 2. !important
        if (stateToken[0] === '!') {
            this.important = true
            stateToken = stateToken.slice(1)
        }

        this.stateToken = stateToken

        // 4. suffix selector
        const stateTokens = stateToken.split('@')
        const suffixSelector = stateTokens[0]
        if (suffixSelector) {
            this.selectorNodes = parseSelector(suffixSelector, css)
        }

        // 5. atTokens
        for (let i = 1; i < stateTokens.length; i++) {
            const atToken = stateTokens[i]
            if (css.config.modes?.[atToken]) {
                this.mode = atToken
                continue
            }
            this.atToken = (this.atToken || '') + '@' + atToken
            const atRule = parseAt(atToken, css)
            const targetNodes = this.atRules?.[atRule.id]
            if (targetNodes) {
                targetNodes.push(...atRule.nodes)
            } else {
                this.atRules = {
                    ...this.atRules,
                    [atRule.id]: atRule.nodes
                }
            }
        }

        if (this.mode && css.config.modeTrigger === 'media') {
            const atComp = {
                name: 'prefers-color-scheme',
                value: this.mode
            } as AtRuleStringNode
            if (this.atRules?.media) {
                this.atRules.media.push(atComp)
            } else {
                this.atRules = {
                    media: [atComp]
                }
            }
        }

        if (this.fixedClass) {
            this.layer = css.componentsLayer
        } else {
            const onlyNode = this.atRules?.layer?.length === 1 && this.atRules.layer[0] as AtRuleValueNode
            if (onlyNode) {
                if (onlyNode.value === 'base') {
                    this.layer = css.baseLayer
                    this.atRules.layer = undefined
                } else if (onlyNode.value === 'preset') {
                    this.layer = css.presetLayer
                    this.atRules.layer = undefined
                }
            }
        }

        // 7. value
        let newValue: string
        if (this.valueComponents) {
            if (transformValueComponents) {
                this.valueComponents = transformValueComponents.call(this, this.valueComponents)
            }
            newValue = this.resolveValue(this.valueComponents, unit, [], false)
            if (transformValue) {
                newValue = transformValue.call(this, newValue)
            }
            if (definition.declarations) {
                const declarations: any = {}
                for (const propertyName in definition.declarations) {
                    const propertyValue = definition.declarations[propertyName as keyof PropertiesHyphen]
                    declarations[propertyName] = propertyValue === undefined
                        ? newValue
                        : Array.isArray(propertyValue)
                            ? propertyValue.map((v) => v === undefined ? newValue : v).join('')
                            : propertyValue
                }
                this.declarations = declarations
            } else if (declarer) {
                const declare = declarers[declarer.name]
                this.declarations = declare.call(this, newValue, this.valueComponents, declarer.data)
            } else if (id) {
                this.declarations = {
                    [id]: newValue
                }
            }
        } else {
            this.declarations = definition.declarations
        }

        if (!Object.entries(this.declarations ?? {}).length) {
            this.valid = false
        } else {
            for (const propertyName in this.declarations) {
                if (this.css.animations && (propertyName === 'animation' || propertyName === 'animation-name')) {
                    const propertyValue = this.declarations[propertyName as keyof PropertiesHyphen] as string
                    if (!propertyValue) continue
                    const rawValues = propertyValue.split(' ')
                    for (const rawValue of rawValues) {
                        if (this.css.animations.has(rawValue)) {
                            if (!this.animationNames) {
                                this.animationNames = new Set([rawValue])
                            } else {
                                this.animationNames.add(rawValue)
                            }
                            continue
                        }
                    }
                }
            }
            this.priority = calcRulePriority(this)
        }
    }

    get text() {
        if (!this.valid) return ''
        const propertiesText: string[] = []
        for (const propertyName in this.declarations) {
            const propertyValue = this.declarations[propertyName as keyof PropertiesHyphen]
            const propertyText = propertyName + ':' + String(propertyValue)
            propertiesText.push(
                propertyText + (((this.important || this.css.config.important) && !propertyText.endsWith('!important')) ? '!important' : '')
            )
        }
        let text = this.selectorText + '{' + propertiesText.join(';') + '}'
        if (this.atRules !== undefined)
            AT_IDENTIFIERS.forEach(id => {
                const nodes = this.atRules?.[id]
                if (!nodes) return
                text = generateAt({ id, nodes }) + '{' + text + '}'
            })
        return text
    }

    get selectorText() {
        let pre = ''
        if (this.css.config.scope) {
            pre = this.css.config.scope + ' ' + pre
        }
        if (this.mode) {
            const modeSelector = this.css.getModeSelector(this.mode)
            if (modeSelector) {
                pre = modeSelector + ' ' + pre
            }
        }
        const body = pre + '.' + cssEscape(this.fixedClass ?? this.name)
        return this.selectorNodes
            ? generateSelector(this.selectorNodes, body)
            : body
    }

    resolveValue = (valueComponents: ValueComponent[], unit: string, bypassVariableNames: string[], bypassParsing: boolean) => {
        const { functions } = this.css.config

        let currentValue = ''
        for (const eachValueComponent of valueComponents) {
            switch (eachValueComponent.type) {
                case 'function':
                    const functionDefinition = functions && functions[eachValueComponent.name]
                    if (functionDefinition?.transform && !eachValueComponent.bypassTransform) {
                        const result = functionDefinition.transform.call(
                            this,
                            this.resolveValue(
                                eachValueComponent.children,
                                functionDefinition.unit ?? unit,
                                bypassVariableNames,
                                bypassParsing || eachValueComponent.name === 'calc'
                            ),
                            bypassVariableNames
                        )
                        currentValue += eachValueComponent.token = eachValueComponent.text = typeof result === 'string'
                            ? result
                            : this.resolveValue(result, functionDefinition?.unit ?? unit, bypassVariableNames, bypassParsing)
                    } else {
                        currentValue += eachValueComponent.token = eachValueComponent.text = eachValueComponent.name
                            + eachValueComponent.symbol
                            + this.resolveValue(eachValueComponent.children, functionDefinition?.unit ?? unit, bypassVariableNames, bypassParsing)
                            + VALUE_DELIMITERS[eachValueComponent.symbol as keyof typeof VALUE_DELIMITERS]
                    }
                    break
                // todo: 應挪到 parseValues 階段處理才能支援 variables: { x: 'calc(20vw-30px)' } 這種情況，並且解析上可能會比較合理、精簡
                case 'variable':
                    const variable = this.css.variables.get(eachValueComponent.name)
                    if (variable) {
                        const handleVariable = (
                            normalHandler: (variable: Variable) => void,
                            varHandler: () => void
                        ) => {
                            if (variable.modes) {
                                if (this.mode) {
                                    const themeVariable = variable.modes[this.mode] ?? variable
                                    if (themeVariable?.value) {
                                        normalHandler(themeVariable as any)
                                    }
                                } else {
                                    if (this.variableNames) {
                                        this.variableNames.add(eachValueComponent.name)
                                    } else {
                                        this.variableNames = new Set([eachValueComponent.name])
                                    }
                                    varHandler()
                                }
                            } else {
                                normalHandler(variable)
                            }
                        }
                        switch (variable.type) {
                            case 'string':
                                handleVariable(
                                    (variable) => {
                                        const valueComponents: ValueComponent[] = []
                                        this.parseValues(valueComponents, 0, variable.value as string, unit, '', undefined, bypassParsing, [...bypassVariableNames, eachValueComponent.name])
                                        currentValue += eachValueComponent.text = this.resolveValue(
                                            valueComponents,
                                            unit,
                                            [...bypassVariableNames, eachValueComponent.name],
                                            bypassParsing
                                        )
                                    },
                                    () => {
                                        currentValue += eachValueComponent.text = `var(--${eachValueComponent.name})`
                                    }
                                )
                                break
                            case 'number':
                                handleVariable(
                                    (variable) => {
                                        if (bypassParsing) {
                                            currentValue += eachValueComponent.text = String(variable.value)
                                        } else {
                                            const valueComponent = this.parseValue(variable.value, unit) as NumberValueComponent
                                            currentValue += eachValueComponent.text = valueComponent.value + (valueComponent.unit ?? '')
                                        }
                                    },
                                    () => {
                                        currentValue += eachValueComponent.text = unit
                                            ? `calc(var(--${eachValueComponent.name}) / 16 * 1rem)`
                                            : `var(--${eachValueComponent.name})`
                                    }
                                )
                                break
                            case 'color':
                                const alpha = eachValueComponent.alpha ? '/' + eachValueComponent.alpha : ''
                                handleVariable(
                                    (variable) => {
                                        currentValue += eachValueComponent.text = `${(variable as ColorVariable)['space']}(${variable.value}${alpha})`
                                    },
                                    () => {
                                        currentValue += eachValueComponent.text = `${variable.space}(var(--${eachValueComponent.name})${alpha})`
                                    }
                                )
                                break
                        }
                    } else {
                        currentValue += eachValueComponent.text = `var(--${eachValueComponent.name}${(eachValueComponent.fallback ? ',' + eachValueComponent.fallback : '')})`
                    }
                    break
                case 'separator':
                    currentValue += eachValueComponent.text ? eachValueComponent.text : (eachValueComponent.text = eachValueComponent.value)
                    break
                case 'number':
                    currentValue += eachValueComponent.text = eachValueComponent.value + (eachValueComponent.unit || '')
                    break
                default:
                    currentValue += eachValueComponent.text = eachValueComponent.value
                    break
            }
        }
        return currentValue
    }

    parseValues = (
        currentValueComponents: ValueComponent[],
        i: number,
        value: string,
        unit: string,
        endSymbol: string,
        parentFunctionName?: string,
        bypassParsing = false,
        bypassVariableNames: string[] = []
    ) => {
        const root = parentFunctionName === undefined
        const isVarFunction = !root
            && (
                parentFunctionName.endsWith('$')
                || parentFunctionName.endsWith('var')
            )
        const checkIsString = (value: string) => value === '\'' || value === '"'
        const isString = checkIsString(endSymbol)
        const separators = [',']
        if (this.definition.separators?.length) {
            separators.push(...this.definition.separators)
        }

        let currentValue = ''
        const parse = () => {
            if (currentValue) {
                let handled = false
                if (!isVarFunction || currentValueComponents.length) {
                    const handleVariable = (variableName: string, alpha?: string) => {
                        const globalVariableValue = this.css.variables.get(variableName)
                        const variable = Object.prototype.hasOwnProperty.call(this.variables, variableName)
                            ? this.variables[variableName]
                            : globalVariableValue
                        if (variable) {
                            const name = variable.name ?? variableName
                            if (!bypassVariableNames.includes(name)) {
                                handled = true
                                const valueComponent: VariableValueComponent = { type: 'variable', name, variable: this.css.variables.get(name), token: currentValue }
                                if (alpha) valueComponent.alpha = alpha
                                currentValueComponents.push(valueComponent)
                            }
                        }
                    }

                    if (/^\$[a-zA-Z0-9-]+(?:\/[^\/]+)?$/.test(currentValue)) {
                        const [raw, alpha] = currentValue.slice(1).split('/')
                        handleVariable(raw, alpha)
                    } else {
                        handleVariable(currentValue)
                        if (!handled) {
                            const [colorName, alpha] = currentValue.split('/')
                            handleVariable(colorName, alpha)
                        }
                    }
                }

                if (!handled) {
                    if (!isVarFunction) {
                        const result = BASE_UNIT_REGEX.exec(currentValue)
                        if (result) {
                            currentValue = String(+result[1] * (this.css.config.baseUnit ?? 1))
                        }
                    }
                    if (bypassParsing) {
                        currentValueComponents.push({ type: 'string', value: currentValue, token: currentValue })
                    } else {
                        const parsedValue = this.parseValue(currentValue, unit)
                        currentValueComponents.push({ ...parsedValue, token: currentValue })
                    }
                }

                currentValue = ''
            }
        }

        for (; i < value.length; i++) {
            const val = value[i]
            if (val === endSymbol) {
                if (isString) {
                    let count = 0
                    for (let j = currentValue.length - 1; ; j--) {
                        if (currentValue[j] !== '\\')
                            break

                        count++
                    }
                    if (count % 2) {
                        currentValue += val
                        continue
                    } else {
                        parse()
                    }
                } else {
                    parse()
                }

                return i
            } else if (!isString && val in VALUE_DELIMITERS) {
                const functionName = currentValue
                const newValueComponent: ValueComponent[][0] = { type: 'function', name: functionName, symbol: val, children: [], token: '' }
                currentValueComponents.push(newValueComponent)
                currentValue = ''
                const functionDefinition = val === '(' ? this.css.config.functions?.[functionName] : undefined
                i = this.parseValues(
                    newValueComponent.children,
                    ++i,
                    value,
                    functionDefinition?.unit ?? unit,
                    VALUE_DELIMITERS[val as keyof typeof VALUE_DELIMITERS],
                    functionName || parentFunctionName || '',
                    bypassParsing || functionName === 'calc'
                )
            } else if ((val === '|' || val === ' ') && endSymbol !== '}' && (!isString || parentFunctionName === 'path')) {
                parse()
                currentValueComponents.push({ type: 'separator', value: ' ', token: val })
            } else {
                if (!isString) {
                    if (val === '.') {
                        if (isNaN(+value[i + 1])) {
                            if (root)
                                break
                        } else if (value[i - 1] === '-') {
                            currentValue += '0'
                        }
                    } else if (separators.includes(val)) {
                        parse()
                        currentValueComponents.push({
                            type: 'separator',
                            value: val,
                            text: (val === ',' ? '' : ' ') + val + (val === ',' ? '' : ' '),
                            token: val
                        })
                        continue
                    } else if (
                        root
                        && (
                            val === '#' && (currentValue || currentValueComponents.length && currentValueComponents[currentValueComponents.length - 1]['type'] !== 'separator')
                            || ['!', '*', '>', '+', '~', ':', '[', '@', '_'].includes(val)
                        )
                    ) {
                        break
                    }
                }
                currentValue += val
            }
        }
        parse()
        return i
    }

    parseValue(token: string | number, unit = this.definition.unit) {
        const parsed = parseValue(token, unit, this.css.config.rootSize)
        // exclude like `aspect:1/2` from being parsed as 50%
        if (this.definition.unit && parsed.type === 'string') {
            // 1/2 → 50%
            if (/^\d+\/\d+$/.test(parsed.value)) {
                const [numerator, denominator] = parsed.value.split('/').map(Number)
                return {
                    token,
                    value: (numerator / denominator) * 100,
                    unit: '%',
                    type: 'number',
                } as NumberValueComponent
            }
        }
        return parsed
    }

    get key(): string {
        return (this.fixedClass ? this.fixedClass + ' ' : '') + this.name
    }
}

export interface SyntaxRule extends DefinedRule {
    token: string
    selectorNodes?: SelectorNode[]
    important: boolean
    direction: string
    mode: string
    unitToken: string
    keyToken: string
    valueToken: string
    stateToken: string
    atToken: string
    valueComponents: ValueComponent[]
}