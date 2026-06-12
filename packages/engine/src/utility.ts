/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import MasterCSS from './core'
import cssEscape from 'shared/utils/css-escape'
import UtilityType, { type UtilityType as UtilityTypeValue } from 'shared/utility-type'
import { type PropertiesHyphen } from 'csstype'
import { VALUE_DELIMITERS, BASE_UNIT_REGEX, AT_IDENTIFIERS } from './common'
import Layer from './layer'
import type { NumberValueComponent, ValueComponent, VariableValueComponent, Variable, StringValueComponent } from 'shared/css-syntax'
import { AtRule, AtRuleNode, AtRuleStringNode, AtRuleValueNode, } from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseAt from './utils/parse-at'
import type { AtIdentifier } from 'shared/css-config'
import type { MasterCSSPlanUtilityLayerName, MasterCSSPlanVariantBranch, MasterCSSPlanVariantToken } from 'shared/master-css-plan'
import type { CompiledUtility } from './core'
import generateAt from './utils/generate-at'
import parseSelector, { SelectorNode } from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import { calcRulePriority, RulePriority } from './utils/compare-rule-priority'
import collectVariableNames from './utils/collect-variable-names'
import wrapAtRules from './utils/wrap-at-rules'
import { createAlphaColorValue, createCSSVariableReference, createNumberVariableReference, normalizeVariableValue, replaceCSSVariableReferences } from './utils/css-variables'
import collectAnimationNames from './utils/collect-animation-names'
import { BORDER_STYLE_VALUES } from './common'

type UtilityStateBranch = {
    selectorTemplate?: string
    selectorNodes?: SelectorNode[]
    atRules?: Partial<Record<AtIdentifier, AtRuleNode[]>>
    layer?: MasterCSSPlanUtilityLayerName
    mode?: string
    key: string
    valid?: boolean
}

function isVariantToken(value: string): value is MasterCSSPlanVariantToken {
    return /^:{1,2}[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value) || /^@[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value)
}

function composeSelectorTemplate(current: string | undefined, next: string | undefined) {
    if (!next || next === '&') return current
    return next.replace(/&/g, current || '&')
}

function cloneAtRules(atRules?: Partial<Record<AtIdentifier, AtRuleNode[]>>) {
    if (!atRules) return
    const cloned: Partial<Record<AtIdentifier, AtRuleNode[]>> = {}
    for (const id of AT_IDENTIFIERS) {
        const nodes = atRules[id]
        if (nodes?.length) cloned[id] = [...nodes]
    }
    return cloned
}

function mergeAtRuleNodeMap(
    current: Partial<Record<AtIdentifier, AtRuleNode[]>> | undefined,
    atRule: { id: AtIdentifier, nodes: AtRuleNode[] }
) {
    const merged = cloneAtRules(current) || {}
    merged[atRule.id] = [...(merged[atRule.id] || []), ...atRule.nodes]
    return merged
}

function mergeBranch(base: UtilityStateBranch, branch: MasterCSSPlanVariantBranch, css: MasterCSS, key: string): UtilityStateBranch {
    let atRules = cloneAtRules(base.atRules)
    for (const atRule of branch.atRuleNodes || []) {
        atRules = mergeAtRuleNodeMap(atRules, atRule as AtRule)
    }
    if (!branch.atRuleNodes?.length) {
        for (const atRule of branch.atRules || []) {
            const parsed = parseAt(atRule, css)
            atRules = mergeAtRuleNodeMap(atRules, parsed as { id: AtIdentifier, nodes: AtRuleNode[] })
        }
    }
    if (branch.selectorNodes?.length && !branch.selector) {
        return {
            ...base,
            key: base.key + key,
            selectorNodes: branch.selectorNodes as SelectorNode[],
            ...(atRules ? { atRules } : {}),
            ...(branch.layer || base.layer ? { layer: branch.layer || base.layer } : {}),
            valid: base.valid !== false && !(base.layer && branch.layer && base.layer !== branch.layer)
        }
    }
    const layer = branch.layer || base.layer
    return {
        ...base,
        key: base.key + key,
        selectorTemplate: composeSelectorTemplate(base.selectorTemplate, branch.selector),
        ...(atRules ? { atRules } : {}),
        ...(layer ? { layer } : {}),
        valid: base.valid !== false && !(base.layer && branch.layer && base.layer !== branch.layer)
    }
}

function findClosingParen(value: string, start: number) {
    let depth = 0
    let quote = ''
    for (let index = start; index < value.length; index++) {
        const char = value[index]
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(') depth++
        if (char === ')') {
            depth--
            if (depth === 0) return index
        }
    }
    return -1
}

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
            while (value[previousIndex] === ' ') previousIndex--
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

export class Utility {
    native?: CSSRule
    nodes?: UtilityRuleNode[]
    readonly atRules?: Partial<Record<AtIdentifier, AtRuleNode[]>>
    readonly priority!: RulePriority
    readonly type: UtilityTypeValue = UtilityType.Normal
    readonly declarations?: PropertiesHyphen
    readonly declarationRules?: { declarations: PropertiesHyphen, atRules?: string[], selector?: string }[]
    readonly layer!: Layer
    readonly layerName: MasterCSSPlanUtilityLayerName
    explicitLayerName?: MasterCSSPlanUtilityLayerName
    readonly valid: boolean = true
    animationNames?: Set<string>
    variableNames?: Set<string>
    readonly branchIndex?: number
    readonly branchCount: number = 1
    readonly selectorTemplate?: string
    variantBranchKey?: string
    constructor(
        public readonly name: string,
        public css: MasterCSS,
        public readonly registeredUtility: CompiledUtility,
        public fixedClass?: string,
        mode?: string,
        branchIndex = 0
    ) {
        this.branchIndex = branchIndex
        this.mode = mode as string
        this.layerName = registeredUtility.layer || 'utilities'
        const {
            name: _registeredName,
            key: _key,
            layer: _layer,
            atRules: _sourceAtRules,
            ...runtimeUtility
        } = registeredUtility
        Object.assign(this, runtimeUtility)
        const { id, type, unit } = registeredUtility
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
            const parsedValueIndex = this.parseValues(this.valueComponents, 0, valueToken, unit || '', '', undefined, false,
                registeredUtility.includeAnimations ? Array.from(this.css.animations.keys()) : []
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

        const stateBranches = this.resolveStateBranches(stateToken)
        this.branchCount = stateBranches.length
        const stateBranch = stateBranches[branchIndex]
        if (!stateBranch) {
            this.valid = false
            return
        }
        if (stateBranch.mode) this.mode = stateBranch.mode
        if (stateBranch.selectorNodes?.length) this.selectorNodes = stateBranch.selectorNodes
        if (stateBranch.selectorTemplate) this.selectorTemplate = stateBranch.selectorTemplate
        if (stateBranch.atRules) this.atRules = stateBranch.atRules
        if (stateBranch.valid === false) this.valid = false
        this.variantBranchKey = stateBranch.key

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
        if (stateBranch.layer) {
            if (this.explicitLayerName && this.explicitLayerName !== stateBranch.layer) {
                this.valid = false
            }
            this.layerName = stateBranch.layer
            this.explicitLayerName = stateBranch.layer
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
            this.valueComponents = this.applyTransform(this.valueComponents)
            newValue = this.resolveValue(this.valueComponents, unit || '', [], false)
            const declarations = this.emitDynamicDeclarations(newValue)
            this.declarations = declarations
            if (declarations && registeredUtility.atRules?.length) {
                this.declarationRules = [{ declarations, atRules: registeredUtility.atRules }]
            }
        } else {
            const declarationRules = registeredUtility.emit.type === 'static'
                ? registeredUtility.emit.rules.map(({ declarations, atRules, selector }) => ({
                    declarations: declarations as PropertiesHyphen,
                    atRules,
                    selector
                }))
                : []
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

    applyTransform(valueComponents: ValueComponent[]) {
        switch (this.registeredUtility.transform) {
            case 'auto-fill-solid':
                return this.transformAutoFillSolid(valueComponents)
            case 'animation-token':
                return this.transformAnimationToken(valueComponents)
            default:
                return valueComponents
        }
    }

    transformAutoFillSolid(valueComponents: ValueComponent[]) {
        if (valueComponents.length < 2) return valueComponents
        let styleIncluded = false
        let varIncluded = false
        for (const valueComponent of valueComponents) {
            if (
                valueComponent.type === 'string' && BORDER_STYLE_VALUES.includes(valueComponent.value)
                || valueComponent.type === 'variable' && BORDER_STYLE_VALUES.includes(String(valueComponent.variable?.value))
            ) {
                styleIncluded = true
            }
            if (valueComponent.type === 'function' && valueComponent.name === 'var') {
                varIncluded = true
            }
        }
        if (!styleIncluded && !varIncluded) {
            valueComponents.push(
                { type: 'separator', value: ' ', token: '|' },
                { type: 'string', value: 'solid', token: 'solid' }
            )
        }
        return valueComponents
    }

    transformAnimationToken(valueComponents: ValueComponent[]) {
        if (valueComponents.length !== 1) {
            return valueComponents.map((valueComponent) => {
                if (
                    valueComponent.type === 'variable'
                    && valueComponent.variable?.namespace === 'animation'
                    && valueComponent.token[0] !== '$'
                ) {
                    return {
                        type: 'string',
                        value: valueComponent.variable.key,
                        token: valueComponent.token
                    } satisfies ValueComponent
                }
                return valueComponent
            })
        }

        const [valueComponent] = valueComponents
        if (valueComponent.type !== 'string') return valueComponents

        const variableName = 'animation-' + valueComponent.value
        const variable = this.css.variables.get(variableName)
        if (!variable) return valueComponents

        return [{
            type: 'variable',
            name: variableName,
            variable,
            token: valueComponent.token
        } satisfies VariableValueComponent]
    }

    emitDynamicDeclarations(newValue: string): PropertiesHyphen | undefined {
        const emit = this.registeredUtility.emit
        switch (emit.type) {
            case 'declarations': {
                const declarations: Record<string, string> = {}
                for (const property of emit.declarations) {
                    declarations[property] = newValue
                }
                return declarations as PropertiesHyphen
            }
            case 'template': {
                const declarations: Record<string, string | number> = {}
                for (const propertyName in emit.declarations) {
                    const propertyValue = emit.declarations[propertyName as keyof PropertiesHyphen]
                    declarations[propertyName] = propertyValue === undefined
                        ? newValue
                        : Array.isArray(propertyValue)
                            ? propertyValue.map((value) => value === undefined ? newValue : value).join('')
                            : propertyValue
                }
                return declarations as PropertiesHyphen
            }
            case 'pair': {
                const [x, y] = emit.properties
                const length = this.valueComponents.length
                return {
                    [x]: length === 1 ? this.valueComponents[0].text : this.valueComponents[0].text,
                    [y]: length === 1 ? this.valueComponents[0].text : this.valueComponents[2].text
                } as PropertiesHyphen
            }
            case 'css-variable-assignment':
                return {
                    ['--' + this.keyToken.slice(1, -1)]: newValue
                } as PropertiesHyphen
            case 'group':
                return this.emitGroupDeclarations(newValue)
            case 'property':
                return {
                    [emit.property]: newValue
                } as PropertiesHyphen
            case 'static':
                return
        }
    }

    emitGroupDeclarations(value: string): PropertiesHyphen {
        const declarations: Record<string, unknown> = {}
        const addProp = (propertyName: string) => {
            const indexOfColon = propertyName.indexOf(':')
            if (indexOfColon !== -1) {
                const propName = propertyName.slice(0, indexOfColon)
                declarations[propName] = propertyName.slice(indexOfColon + 1).replace(/\|/g, ' ')
            }
        }
        const handleRule = (rule: Utility) => {
            const ruleDeclarations = rule.declarations as Record<string, unknown>
            for (const propertyName in ruleDeclarations) {
                let propertyValue = String(ruleDeclarations[propertyName])
                const important = 'important' in rule && rule.important
                if ((important || rule.css.config.important) && !propertyValue.endsWith('!important')) {
                    propertyValue += '!important'
                }
                declarations[propertyName] = propertyValue
            }

            if (rule.animationNames) {
                if (!this.animationNames) this.animationNames = new Set()
                for (const eachKeyframeName of rule.animationNames) {
                    this.animationNames.add(eachKeyframeName)
                }
            }

            if (rule.variableNames) {
                if (this.variableNames) {
                    for (const eachVariableName of rule.variableNames) {
                        this.variableNames.add(eachVariableName)
                    }
                } else {
                    this.variableNames = new Set(rule.variableNames)
                }
            }
        }

        const names: string[] = []
        let currentName = ''
        const addName = () => {
            if (currentName) {
                names.push(currentName.replace(/ /g, '|'))
                currentName = ''
            }
        }

        let i = 1;
        (function analyze(end: string) {
            for (; i < value.length; i++) {
                const char = value[i]

                if (!end) {
                    if (char === ';') {
                        addName()
                        continue
                    }
                    if (char === '}') {
                        break
                    }
                }

                currentName += char

                if (end === char) {
                    if (end === '\'' || end === '"') {
                        let count = 0
                        for (let j = currentName.length - 2; ; j--) {
                            if (currentName[j] !== '\\') {
                                break
                            }
                            count++
                        }
                        if (count % 2) {
                            continue
                        }
                    }

                    break
                } else if (char in VALUE_DELIMITERS && (end !== '\'' && end !== '"')) {
                    i++
                    analyze(VALUE_DELIMITERS[char as keyof typeof VALUE_DELIMITERS])
                }
            }
        })('')

        addName()

        for (const eachName of names) {
            const rules = this.css.generate(eachName, this.mode)
            if (rules.length) {
                for (const eachRule of rules) {
                    handleRule(eachRule)
                }
            } else {
                addProp(eachName)
            }
        }

        return declarations as PropertiesHyphen
    }

    resolveStateBranches(stateToken: string): UtilityStateBranch[] {
        const [selectorToken = '', ...conditionTokens] = stateToken.split('@')
        let branches: UtilityStateBranch[] = [{ key: '' }]
        branches = this.applySelectorTokenBranches(branches, selectorToken)

        for (const conditionToken of conditionTokens) {
            if (this.css.modes.includes(conditionToken)) {
                branches = branches.map((branch) => ({
                    ...branch,
                    mode: conditionToken,
                    key: branch.key + '@' + conditionToken
                }))
                continue
            }

            this.atToken = (this.atToken || '') + '@' + conditionToken
            const variantToken = `@${conditionToken}` as MasterCSSPlanVariantToken
            const variantBranches = this.css.resolveVariant(variantToken)
            if (variantBranches) {
                branches = branches.flatMap((branch) =>
                    variantBranches.map((variantBranch, index) =>
                        mergeBranch(branch, variantBranch, this.css, `${variantToken}#${index}`)
                    )
                )
                continue
            }

            const atRule = parseAt(conditionToken, this.css)
            branches = branches.map((branch) => ({
                ...branch,
                key: branch.key + '@' + conditionToken,
                atRules: mergeAtRuleNodeMap(branch.atRules, atRule as { id: AtIdentifier, nodes: AtRuleNode[] })
            }))
        }

        return branches.length ? branches : [{ key: '' }]
    }

    applySelectorTokenBranches(branches: UtilityStateBranch[], selectorToken: string): UtilityStateBranch[] {
        if (!selectorToken) return branches

        const selectorVariantTokens = [...this.css.variants.keys()]
            .filter((token) => token.startsWith(':'))
            .sort((a, b) => b.length - a.length)
        let index = 0
        let raw = ''
        const flushRaw = () => {
            if (!raw) return
            const rawSelector = generateSelector(parseSelector(raw, this.css), '&')
            branches = branches.map((branch) => ({
                ...branch,
                key: branch.key + raw,
                selectorTemplate: composeSelectorTemplate(branch.selectorTemplate, rawSelector),
                selectorNodes: parseSelector((branch.selectorTemplate
                    ? composeSelectorTemplate(branch.selectorTemplate, rawSelector)?.replace(/&/g, '') || ''
                    : raw), this.css)
            }))
            raw = ''
        }

        while (index < selectorToken.length) {
            const matchedToken = selectorVariantTokens.find((token) => {
                if (!selectorToken.startsWith(token, index)) return false
                const next = selectorToken[index + token.length]
                return next === undefined || next === '(' || !/[-_a-zA-Z0-9]/.test(next)
            })
            if (!matchedToken || !isVariantToken(matchedToken)) {
                raw += selectorToken[index++]
                continue
            }

            const variantBranches = this.css.resolveVariant(matchedToken)
            if (!variantBranches) {
                raw += selectorToken[index++]
                continue
            }

            flushRaw()
            index += matchedToken.length
            let suffix = ''
            if (selectorToken[index] === '(') {
                const end = findClosingParen(selectorToken, index)
                if (end !== -1) {
                    suffix = selectorToken.slice(index, end + 1)
                    index = end + 1
                }
            }
            branches = branches.flatMap((branch) =>
                variantBranches.map((variantBranch, branchIndex) => {
                    const selector = variantBranch.selector && suffix
                        ? variantBranch.selector + suffix
                        : variantBranch.selector
                    const merged = mergeBranch(branch, { ...variantBranch, ...(selector ? { selector } : {}) }, this.css, `${matchedToken}#${branchIndex}${suffix}`)
                    const selectorTemplate = merged.selectorTemplate
                    return {
                        ...merged,
                        ...(selectorTemplate
                            ? { selectorNodes: parseSelector(selectorTemplate.replace(/&/g, ''), this.css) }
                            : {})
                    }
                })
            )
        }

        flushRaw()
        return branches
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
        let base = this.selectorTemplate
            ? body
            : this.selectorNodes
                ? generateSelector(this.selectorNodes, body)
                : body
        if (this.selectorTemplate) {
            base = this.selectorTemplate.replace(/&/g, base)
        }
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
                    const functionOp = functionDefinition?.op
                    if (functionOp && !eachValueComponent.bypassTransform) {
                        const resolvedValue = this.resolveValue(eachValueComponent.children, functionDefinition.unit ?? unit, bypassVariableNames, bypassParsing || eachValueComponent.name === 'calc')
                        const result = this.applyFunctionOp(functionOp, resolvedValue, bypassVariableNames, functionDefinition.options)
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

    applyFunctionOp(op: string, value: string, bypassVariableNames: string[], options?: unknown) {
        switch (op) {
            case 'core.variable':
                return this.resolveVariableFunction(value)
            case 'core.math':
                return this.resolveMathFunction(value, bypassVariableNames, options as CoreMathData | undefined)
            default:
                return value
        }
    }

    resolveVariableFunction(value: string): ValueComponent[] {
        let name: string
        let fallback!: string
        const firstCommaIndex = value.indexOf(',')
        if (firstCommaIndex !== -1) {
            name = value.slice(0, firstCommaIndex)
            fallback = value.slice(firstCommaIndex + 1)
        } else {
            name = value
        }
        return [{ type: 'variable', name, fallback, token: value }]
    }

    resolveMathFunction(value: string, bypassVariableNames: string[], data?: CoreMathData) {
        const functionName = data?.name ?? 'calc'
        const valueComponents: ValueComponent[] = []
        let i = 0

        const anaylzeDeeply = (
            currentValueComponents: ValueComponent[],
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
                if (childHasUnit === false && separator !== ' ' && this.registeredUtility.unit) {
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
                if (this.registeredUtility.unit === 'rem' || this.registeredUtility.unit === 'em') {
                    currentValueComponents.push(
                        { type: 'separator', value: '/', text: ' / ', token: '/' },
                        { type: 'number', value: this.css.config.rootSize as number, token: String(this.css.config.rootSize) }
                    )
                }
                currentValueComponents.push(
                    { type: 'separator', value: '*', text: ' * ', token: '*' },
                    { type: 'number', value: 1, unit: this.registeredUtility.unit, token: this.registeredUtility.unit || '' }
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
                    const nestedFunctionName = symbolResult ? current.slice(1) : current
                    const newValueComponent: ValueComponent = {
                        type: 'function',
                        name: nestedFunctionName,
                        symbol: char,
                        children: [],
                        bypassTransform: nestedFunctionName === 'calc',
                        token: current
                    }
                    currentValueComponents.push(newValueComponent)
                    current = ''
                    i++
                    const nestedIsVarFunction = nestedFunctionName === '$' || nestedFunctionName === 'var'
                    childHasUnit = anaylzeDeeply(
                        newValueComponent.children,
                        nestedFunctionName !== ''
                        && nestedFunctionName !== 'calc'
                        && (
                            nestedIsVarFunction
                            || Object.prototype.hasOwnProperty.call(this.css.config.functions || {}, nestedFunctionName)
                        ),
                        bypassParsing || nestedIsVarFunction || unitChecking && currentHasUnit,
                        unitChecking,
                        nestedIsVarFunction
                    ) || nestedFunctionName === 'var'
                    if (!childHasUnit && nestedFunctionName === '$') {
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
                            if (this.registeredUtility.unit) {
                                unitChecking = true
                            }
                            clear(char, ' ', ' ')
                            break
                        case '/':
                            if (this.registeredUtility.unit) {
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

        let resolvedValue = this.resolveValue(valueComponents, this.registeredUtility.unit || '', bypassVariableNames, true)
        if (data?.wrapArguments) {
            resolvedValue = wrapCalcArguments(resolvedValue)
        }
        return functionName + '(' + resolvedValue + ')'
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
        if (this.registeredUtility.separators?.length) {
            separators.push(...this.registeredUtility.separators)
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

    parseValue(token: string | number, unit = this.registeredUtility.unit) {
        const parsed = parseValue(token, unit, this.css.config.rootSize)
        // exclude like `aspect:1/2` from being parsed as 50%
        if (this.registeredUtility.unit && parsed.type === 'string') {
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
        return (this.fixedClass ? this.fixedClass + ' ' : '') + this.name + (this.variantBranchKey ? '\0' + this.variantBranchKey : '')
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

export interface Utility extends Omit<CompiledUtility, 'name' | 'layer' | 'atRules'> {
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
