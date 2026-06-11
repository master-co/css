/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import MasterCSS from './core'
import cssEscape from 'shared/utils/css-escape'
import UtilityType, { type UtilityType as UtilityTypeValue } from 'shared/utility-type'
import { type PropertiesHyphen } from 'csstype'
import { VALUE_DELIMITERS, BASE_UNIT_REGEX, AT_IDENTIFIERS } from './common'
import Layer from './layer'
import type { NumberValueComponent, DefinedUtility, ValueComponent, VariableValueComponent, Variable } from 'shared/css-syntax'
import { AtRuleNode, AtRuleStringNode, AtRuleValueNode, } from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseAt from './utils/parse-at'
import type { AtIdentifier, UtilityLayerName } from 'shared/css-config'
import generateAt from './utils/generate-at'
import parseSelector, { SelectorNode } from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import { calcRulePriority, RulePriority } from './utils/compare-rule-priority'
import collectVariableNames from './utils/collect-variable-names'
import wrapAtRules from './utils/wrap-at-rules'
import declarers from './declarers'
import transformers from './transformers'
import functionTransformers from './function-transformers'
import { createAlphaColorValue, createCSSVariableReference, createNumberVariableReference, normalizeVariableValue, replaceCSSVariableReferences } from './utils/css-variables'
import collectAnimationNames from './utils/collect-animation-names'

export class Utility {
    native?: CSSRule
    nodes?: UtilityRuleNode[]
    readonly atRules?: Partial<Record<AtIdentifier, AtRuleNode[]>>
    readonly priority!: RulePriority
    readonly type: UtilityTypeValue = UtilityType.Normal
    readonly declarations?: PropertiesHyphen
    readonly declarationRules?: { declarations: PropertiesHyphen, atRules?: string[], selector?: string }[]
    readonly layer: Layer
    readonly layerName: UtilityLayerName
    explicitLayerName?: UtilityLayerName
    readonly valid: boolean = true
    animationNames?: Set<string>
    variableNames?: Set<string>
    constructor(
        public readonly name: string,
        public css: MasterCSS,
        public readonly registeredUtility: DefinedUtility,
        public fixedClass?: string,
        mode?: string
    ) {
        this.mode = mode as string
        this.layerName = registeredUtility.definition.layer || 'utilities'
        Object.assign(this, registeredUtility)
        const { id, definition } = registeredUtility
        const { declarer, declarerOptions, transformer, transformerOptions, type, unit } = definition
        this.type = type!

        // 1. value / selectorToken
        let stateToken: string

        if (this.type === UtilityType.Static) {
            stateToken = name.slice(id.length - 1)
        } else {
            let valueToken: string | undefined
            if (id.endsWith('()')) {
                valueToken = name
            } else if (id === 'group') {
                valueToken = name
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

        // 5. at variants
        for (let i = 1; i < stateTokens.length; i++) {
            const atToken = stateTokens[i]
            if (css.modes.includes(atToken)) {
                this.mode = atToken
                continue
            }
            this.atToken = (this.atToken || '') + '@' + atToken
            const atRules = css.resolveAtVariant(atToken) || [parseAt(atToken, css)]
            for (const atRule of atRules) {
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

        if (this.atRules?.layer && this.atRules.layer.length > 1) {
            this.valid = false
        }
        const onlyNode = this.atRules?.layer?.length === 1 && this.atRules.layer[0] as AtRuleValueNode
        if (onlyNode) {
            const layerName = String(onlyNode.value)
            if (layerName === 'base' || layerName === 'defaults' || layerName === 'components' || layerName === 'utilities') {
                this.layerName = layerName
                this.explicitLayerName = layerName
                this.atRules.layer = undefined
            }
        }
        this.layer = css.getUtilityLayer(this.layerName)

        // 7. value
        let newValue: string
        if (this.valueComponents) {
            if (transformer) {
                const transform = (transformers as Record<string, any>)[transformer]
                this.valueComponents = transform.call(this, this.valueComponents, transformerOptions)
            }
            newValue = this.resolveValue(this.valueComponents, unit, [], false)
            if (definition.declarations) {
                const declarations: any = {}
                if (Array.isArray(definition.declarations)) {
                    for (const property of definition.declarations) {
                        declarations[property] = newValue
                    }
                } else {
                    for (const propertyName in definition.declarations) {
                        const propertyValue = definition.declarations[propertyName as keyof PropertiesHyphen]
                        declarations[propertyName] = propertyValue === undefined
                            ? newValue
                            : Array.isArray(propertyValue)
                                ? propertyValue.map((v) => v === undefined ? newValue : v).join('')
                                : propertyValue
                    }
                }
                this.declarations = declarations
                if (definition.atRules?.length) {
                    this.declarationRules = [{ declarations, atRules: definition.atRules }]
                }
            } else if (declarer) {
                const declare = (declarers as Record<string, any>)[declarer]
                const declarations = declare.call(this, newValue, this.valueComponents, declarerOptions) as PropertiesHyphen | undefined
                this.declarations = declarations
                if (declarations && definition.atRules?.length) {
                    this.declarationRules = [{ declarations, atRules: definition.atRules }]
                }
            } else if (id) {
                this.declarations = {
                    [id]: newValue
                }
                if (definition.atRules?.length) {
                    this.declarationRules = [{ declarations: this.declarations, atRules: definition.atRules }]
                }
            }
        } else {
            const declarationRules = [
                ...(definition.declarations
                    ? [{ declarations: definition.declarations as PropertiesHyphen, atRules: definition.atRules, selector: undefined }]
                    : []),
                ...(definition.rules?.map(({ declarations, atRules, selector }) => ({
                    declarations: declarations as PropertiesHyphen,
                    atRules,
                    selector
                })) || [])
            ]
            this.declarations = declarationRules[0]?.declarations
            if (declarationRules.length > 1 || declarationRules.some(({ atRules, selector }) => atRules?.length || selector)) {
                this.declarationRules = declarationRules
            }
        }

        const declarationRules = this.declarationRules || (this.declarations ? [{ declarations: this.declarations }] : [])

        if (!declarationRules.some(({ declarations }) => Object.entries(declarations ?? {}).length)) {
            this.valid = false
        } else {
            for (const { declarations } of declarationRules) {
                const variableNames = collectVariableNames(declarations, this.css.variables)
                if (variableNames) {
                    for (const variableName of variableNames) {
                        if (this.variableNames) {
                            this.variableNames.add(variableName)
                        } else {
                            this.variableNames = new Set([variableName])
                        }
                    }
                }
                const animationNames = collectAnimationNames(declarations, {
                    animationNames: this.css.animations.keys(),
                    variables: this.css.variables,
                    variableNames
                })
                if (animationNames) {
                    for (const animationName of animationNames) {
                        if (this.animationNames) {
                            this.animationNames.add(animationName)
                        } else {
                            this.animationNames = new Set([animationName])
                        }
                    }
                }
            }
            this.priority = calcRulePriority(this)
            if (declarationRules.length > 1) {
                this.nodes = declarationRules.map(({ declarations, atRules, selector }) =>
                    new UtilityRuleNode(this, declarations, atRules, selector)
                )
            }
        }
    }

    get text() {
        if (!this.valid) return ''
        if (this.nodes) {
            return this.nodes.map(({ text }) => text).join('')
        }
        if (this.declarationRules) {
            return this.declarationRules.map(({ declarations, atRules, selector }) => this.createRuleText(declarations, atRules, selector)).join('')
        }
        return this.createRuleText(this.declarations!)
    }

    createRuleText(declarations: PropertiesHyphen, atRules?: string[], selector?: string) {
        const propertiesText: string[] = []
        for (const propertyName in declarations) {
            const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
            const propertyText = propertyName + ':' + String(propertyValue)
            propertiesText.push(
                propertyText + (((this.important || this.css.config.important) && !propertyText.endsWith('!important')) ? '!important' : '')
            )
        }
        let text = this.createSelectorText(selector) + '{' + propertiesText.join(';') + '}'
        if (this.atRules !== undefined)
            AT_IDENTIFIERS.forEach(id => {
                const nodes = this.atRules?.[id]
                if (!nodes) return
                text = generateAt({ id, nodes }) + '{' + text + '}'
            })
        return wrapAtRules(text, atRules)
    }

    get selectorText() {
        return this.createSelectorText()
    }

    createSelectorText(selector?: string) {
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
        const base = this.selectorNodes
            ? generateSelector(this.selectorNodes, body)
            : body
        return selector
            ? selector.replace(/&/g, base)
            : base
    }

    resolveValue = (valueComponents: ValueComponent[], unit: string, bypassVariableNames: string[], bypassParsing: boolean) => {
        const { functions } = this.css.config

        let currentValue = ''
        const addVariableName = (variableName: string) => {
            if (this.variableNames) {
                this.variableNames.add(variableName)
            } else {
                this.variableNames = new Set([variableName])
            }
        }
        const formatResolvedInlineNumber = (value: number) => {
            const parsedValue = this.parseValue(value, unit)
            return parsedValue.type === 'number'
                ? String(parsedValue.value) + (parsedValue.unit || '')
                : parsedValue.value
        }
        const resolveInlineVariable = (variable: Variable, stack: string[] = []): string => {
            const stackIndex = stack.indexOf(variable.name)
            if (stackIndex !== -1) {
                throw new Error(`Circular inline variable reference: ${[...stack.slice(stackIndex), variable.name].join(' -> ')}`)
            }
            if (variable.value === undefined) {
                return createCSSVariableReference(variable.name)
            }
            const nextStack = [...stack, variable.name]
            const value = variable.type === 'number' && typeof variable.value === 'number' && !bypassParsing
                ? formatResolvedInlineNumber(variable.value)
                : normalizeVariableValue(variable.value).value
            return replaceCSSVariableReferences(value, (variableName) => {
                const dependency = this.css.variables.get(variableName)
                if (!dependency) return
                if (dependency.inline) {
                    return resolveInlineVariable(dependency, nextStack)
                }
                if (!bypassVariableNames.includes(variableName)) {
                    addVariableName(variableName)
                }
            })
        }
        for (const eachValueComponent of valueComponents) {
            switch (eachValueComponent.type) {
                case 'function':
                    const functionDefinition = functions && functions[eachValueComponent.name]
                    const fnTransformer = functionDefinition?.transformer
                    if (fnTransformer && !eachValueComponent.bypassTransform) {
                        const resolvedValue = this.resolveValue(eachValueComponent.children, functionDefinition.unit ?? unit, bypassVariableNames, bypassParsing || eachValueComponent.name === 'calc')
                        let result: any
                        const fnTransform = (functionTransformers as Record<string, any>)[fnTransformer]
                        result = fnTransform.call(this, resolvedValue, bypassVariableNames, functionDefinition.transformerOptions)
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
                case 'variable':
                    const variable = this.css.variables.get(eachValueComponent.name)
                    const resolveFallback = () => {
                        if (!eachValueComponent.fallback) return
                        const fallbackComponents: ValueComponent[] = []
                        this.parseValues(fallbackComponents, 0, eachValueComponent.fallback, unit, '', undefined, bypassParsing, bypassVariableNames)
                        return this.resolveValue(fallbackComponents, unit, bypassVariableNames, bypassParsing)
                    }
                    const emitVariable = (variable?: Variable) => {
                        if (variable?.type === 'number' && eachValueComponent.alpha === undefined && !bypassParsing) {
                            return createNumberVariableReference(variable, unit, this.css.config.rootSize)
                        }
                        return createCSSVariableReference(eachValueComponent.name, eachValueComponent.alpha, resolveFallback())
                    }
                    if (variable?.inline) {
                        const inlineValue = resolveInlineVariable(variable)
                        currentValue += eachValueComponent.text = eachValueComponent.alpha === undefined
                            ? inlineValue
                            : createAlphaColorValue(inlineValue, eachValueComponent.alpha)
                    } else if (variable) {
                        addVariableName(eachValueComponent.name)
                        currentValue += eachValueComponent.text = emitVariable(variable)
                    } else {
                        currentValue += eachValueComponent.text = emitVariable()
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
                    const pushVariable = (variableName: string, alpha?: string, token = currentValue) => {
                        const valueComponent: VariableValueComponent = { type: 'variable', name: variableName, variable: this.css.variables.get(variableName), token }
                        if (alpha) valueComponent.alpha = Number(alpha)
                        currentValueComponents.push(valueComponent)
                    }
                    const handleVariable = (variableName: string, alpha?: string) => {
                        const globalVariableValue = this.css.variables.get(variableName)
                        const variable = this.variables?.get(variableName) || globalVariableValue
                        if (variable) {
                            const name = variable.name ?? variableName
                            if (!bypassVariableNames.includes(name)) {
                                handled = true
                                pushVariable(name, alpha)
                            }
                        }
                    }
                    if (/^\$[a-zA-Z0-9-]+(?:\/[^\/]+)?$/.test(currentValue)) {
                        const [raw, alpha] = currentValue.slice(1).split('/')
                        handleVariable(raw, alpha)
                        if (!handled && !bypassVariableNames.includes(raw)) {
                            handled = true
                            pushVariable(raw, alpha)
                        }
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

export class UtilityRuleNode {
    native?: CSSRule

    constructor(
        public readonly rule: Utility,
        public readonly declarations: PropertiesHyphen,
        public readonly atRules?: string[],
        public readonly selector?: string
    ) { }

    get text() {
        return this.rule.createRuleText(this.declarations, this.atRules, this.selector)
    }
}

export interface Utility extends DefinedUtility {
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
