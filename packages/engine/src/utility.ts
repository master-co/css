/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import MasterCSS from './core'
import cssEscape from 'shared/utils/css-escape'
import UtilityType, { type UtilityType as UtilityTypeValue } from 'shared/utility-type'
import { type PropertiesHyphen } from 'csstype'
import { VALUE_DELIMITERS, BASE_UNIT_REGEX, AT_IDENTIFIERS } from './common'
import Layer from './layer'
import type { ValueComponent, VariableValueComponent, Variable, StringValueComponent } from 'shared/css-syntax'
import { AtRule, AtRuleNode, AtRuleStringNode, AtRuleValueNode, } from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseAt from './utils/parse-at'
import type { MasterCSSPlanAtIdentifier, MasterCSSPlanUtilityLayerName, MasterCSSPlanUtilityMatcher, MasterCSSPlanVariantBranch, MasterCSSPlanVariantToken } from 'shared/master-css-plan'
import type { CompiledUtility } from './core'
import generateAt from './utils/generate-at'
import parseSelector, { SelectorNode } from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import { calcRulePriority, RulePriority } from './utils/compare-rule-priority'
import collectVariableNames from './utils/collect-variable-names'
import wrapAtRules from './utils/wrap-at-rules'
import { createAlphaColorValue, createCSSVariableReference, createNegativeNumberVariableReference, createNumberVariableReference, normalizeVariableValue, replaceCSSVariableReferences } from './utils/css-variables'
import collectAnimationNames from './utils/collect-animation-names'

type UtilityStateBranch = {
    selectorTemplate?: string
    selectorNodes?: SelectorNode[]
    atRules?: Partial<Record<MasterCSSPlanAtIdentifier, AtRuleNode[]>>
    layer?: MasterCSSPlanUtilityLayerName
    mode?: string
    key: string
    valid?: boolean
}

type ResolvedVariableAlias = {
    name: string
    variable: Variable
    negative?: boolean
}

function isVariantToken(value: string): value is MasterCSSPlanVariantToken {
    return /^:{1,2}[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value) || /^@[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value)
}

function matchesPatternUtilityName(className: string, name: string) {
    if (!className.startsWith(name)) return false
    const next = className[name.length]
    return next === undefined || next === '!' || next === '*' || next === '>' || next === '+'
        || next === '~' || next === ':' || next === '[' || next === '@' || next === '_' || next === '.'
}

function getPatternUtilityMatch(className: string, matcher: MasterCSSPlanUtilityMatcher) {
    if (matcher.type !== 'pattern') return
    for (const value of matcher.values) {
        const name = matcher.prefix + value
        if (matchesPatternUtilityName(className, name)) {
            return {
                value,
                length: name.length
            }
        }
    }
}

function getUtilityPatternMatch(className: string, utility: CompiledUtility) {
    for (const matcher of utility.matchers) {
        const match = getPatternUtilityMatch(className, matcher)
        if (match) return match
    }
}

const ANIMATION_REFERENCE_PROPERTIES = new Set(['animation', 'animation-name'])

function utilityMayReferenceAnimations(utility: CompiledUtility) {
    const emit = utility.emit
    switch (emit.type) {
        case 'declarations':
            return emit.declarations.some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
        case 'property':
            return ANIMATION_REFERENCE_PROPERTIES.has(emit.property)
        case 'template':
            return Object.keys(emit.declarations).some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
        case 'static':
            return emit.rules.some((rule) =>
                Object.keys(rule.declarations).some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
            )
        default:
            return false
    }
}

function formatMasterBaseUnitValue(value: number, baseUnit: number, rootSize: number) {
    const resolved = value * baseUnit / rootSize
    return String(Object.is(resolved, -0) ? 0 : resolved).replace(/^(-?)0\./, '$1.') + 'rem'
}

function composeSelectorTemplate(current: string | undefined, next: string | undefined) {
    if (!next || next === '&') return current
    return next.replace(/&/g, current || '&')
}

function cloneAtRules(atRules?: Partial<Record<MasterCSSPlanAtIdentifier, AtRuleNode[]>>) {
    if (!atRules) return
    const cloned: Partial<Record<MasterCSSPlanAtIdentifier, AtRuleNode[]>> = {}
    for (const id of AT_IDENTIFIERS) {
        const nodes = atRules[id]
        if (nodes?.length) cloned[id] = [...nodes]
    }
    return cloned
}

function mergeAtRuleNodeMap(
    current: Partial<Record<MasterCSSPlanAtIdentifier, AtRuleNode[]>> | undefined,
    atRule: { id: MasterCSSPlanAtIdentifier, nodes: AtRuleNode[] }
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
            atRules = mergeAtRuleNodeMap(atRules, parsed as { id: MasterCSSPlanAtIdentifier, nodes: AtRuleNode[] })
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
    readonly atRules?: Partial<Record<MasterCSSPlanAtIdentifier, AtRuleNode[]>>
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
    private invalidValueSyntax = false
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
        const { id, type } = registeredUtility
        this.type = type!

        // 1. value / selectorToken
        let stateToken = ''

        if (this.type === UtilityType.Static) {
            stateToken = name.slice(id.length - 1)
        } else {
            let valueToken: string | undefined
            const patternMatch = getUtilityPatternMatch(name, registeredUtility)
            if (patternMatch) {
                valueToken = patternMatch.value
                stateToken = name.slice(patternMatch.length)
                this.keyToken = name.slice(0, patternMatch.length - patternMatch.value.length)
            } else if (id.endsWith('()')) {
                valueToken = name
            } else if (id === 'group') {
                valueToken = name
            } else {
                const indexOfColon = name.indexOf(':')
                this.keyToken = name.slice(0, indexOfColon + 1)
                valueToken = name.slice(indexOfColon + 1)
            }
            this.valueComponents = []
            const parsedValueIndex = this.parseValues(this.valueComponents, 0, valueToken, '', '', undefined, false,
                utilityMayReferenceAnimations(registeredUtility) ? Array.from(this.css.animations.keys()) : []
            )
            if (this.invalidValueSyntax) {
                this.valid = false
                return
            }
            this.valueToken = valueToken.slice(0, parsedValueIndex)
            if (!patternMatch) {
                stateToken = valueToken.slice(parsedValueIndex)
            } else if (parsedValueIndex !== valueToken.length) {
                stateToken = valueToken.slice(parsedValueIndex) + stateToken
            }
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

        if (this.mode && css.settings.modeTrigger === 'media') {
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
            newValue = this.resolveValue(this.valueComponents, '', [], false)
            if (this.invalidValueSyntax) {
                this.valid = false
                return
            }
            const dynamicDeclarationRules = this.emitDynamicDeclarationRules(newValue)
            if (dynamicDeclarationRules) {
                this.declarations = dynamicDeclarationRules[0]?.declarations
                if (
                    dynamicDeclarationRules.length > 1
                    || dynamicDeclarationRules.some(({ atRules, selector }) => atRules?.length || selector)
                ) {
                    this.declarationRules = dynamicDeclarationRules
                }
            } else {
                const declarations = this.emitDynamicDeclarations(newValue)
                this.declarations = declarations
                if (declarations && registeredUtility.atRules?.length) {
                    this.declarationRules = [{ declarations, atRules: registeredUtility.atRules }]
                }
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

    resolveVariableAlias(variableName: string): ResolvedVariableAlias | undefined {
        const variable = this.variables?.get(variableName) || this.css.variables.get(variableName)
        if (variable) {
            return {
                name: variable.name ?? variableName,
                variable
            }
        }

        if (variableName[0] !== '-') return
        const positiveVariableName = variableName.slice(1)
        const positiveVariable = this.variables?.get(positiveVariableName) || this.css.variables.get(positiveVariableName)
        if (positiveVariable?.type !== 'number') return

        return {
            name: positiveVariable.name ?? positiveVariableName,
            variable: positiveVariable,
            negative: true
        }
    }

    resolveDynamicDeclarationValue(value: string | number | null | (string | number | null)[], newValue: string) {
        if (value === null) return newValue
        return Array.isArray(value)
            ? value.map((eachValue) => eachValue === null ? newValue : eachValue).join('')
            : value
    }

    resolveDynamicDeclarations(declarations: PropertiesHyphen, newValue: string) {
        const resolved: Record<string, string | number> = {}
        for (const propertyName in declarations) {
            resolved[propertyName] = this.resolveDynamicDeclarationValue(
                declarations[propertyName as keyof PropertiesHyphen] as string | number | null | (string | number | null)[],
                newValue
            )
        }
        return resolved as PropertiesHyphen
    }

    emitDynamicDeclarationRules(newValue: string) {
        const emit = this.registeredUtility.emit
        if (emit.type !== 'static') return
        return emit.rules.map(({ declarations, atRules, selector }) => ({
            declarations: this.resolveDynamicDeclarations(declarations as PropertiesHyphen, newValue),
            atRules,
            selector
        }))
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
                    declarations[propertyName] = propertyValue == null
                        ? newValue
                        : Array.isArray(propertyValue)
                            ? propertyValue.map((value) => value == null ? newValue : value).join('')
                            : propertyValue
                }
                return declarations as PropertiesHyphen
            }
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
                if ((important || rule.css.settings.important) && !propertyValue.endsWith('!important')) {
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
                atRules: mergeAtRuleNodeMap(branch.atRules, atRule as { id: MasterCSSPlanAtIdentifier, nodes: AtRuleNode[] })
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
            if (selectorToken[index] === '(') {
                const end = findClosingParen(selectorToken, index)
                if (end !== -1) {
                    raw += selectorToken.slice(index, end + 1)
                    index = end + 1
                    continue
                }
            }

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
                propertyText + (((this.important || this.css.settings.important) && !propertyText.endsWith('!important')) ? '!important' : '')
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
        if (this.css.settings.scope) {
            pre = this.css.settings.scope + ' ' + pre
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
        const negateResolvedValue = (value: string) => `calc(${value} * -1)`
        for (const eachValueComponent of valueComponents) {
            switch (eachValueComponent.type) {
                case 'function': {
                    if (eachValueComponent.name === '$') {
                        this.invalidValueSyntax = true
                        break
                    }
                    if (!eachValueComponent.bypassTransform && eachValueComponent.name === 'calc') {
                        currentValue += eachValueComponent.token = eachValueComponent.text = this.resolveMathFunction(
                            this.stringifyValueComponents(eachValueComponent.children),
                            bypassVariableNames
                        )
                    } else if (!eachValueComponent.bypassTransform && eachValueComponent.name === 'clamp') {
                        currentValue += eachValueComponent.token = eachValueComponent.text = this.resolveMathFunction(
                            this.stringifyValueComponents(eachValueComponent.children),
                            bypassVariableNames,
                            { name: 'clamp', wrapArguments: true }
                        )
                    } else {
                        currentValue += eachValueComponent.token = eachValueComponent.text = eachValueComponent.name
                            + eachValueComponent.symbol
                            + this.resolveValue(eachValueComponent.children, unit, bypassVariableNames, bypassParsing)
                            + VALUE_DELIMITERS[eachValueComponent.symbol as keyof typeof VALUE_DELIMITERS]
                    }
                    break
                }
                case 'variable':
                    const resolvedVariableAlias = this.resolveVariableAlias(eachValueComponent.name)
                    const variable = resolvedVariableAlias?.variable
                    const variableName = resolvedVariableAlias?.name ?? eachValueComponent.name
                    const negative = eachValueComponent.negative || resolvedVariableAlias?.negative
                    const resolveFallback = () => {
                        if (!eachValueComponent.fallback) return
                        const fallbackComponents: ValueComponent[] = []
                        this.parseValues(fallbackComponents, 0, eachValueComponent.fallback, unit, '', undefined, bypassParsing, bypassVariableNames)
                        return this.resolveValue(fallbackComponents, unit, bypassVariableNames, bypassParsing)
                    }
                    const emitVariable = (variable?: Variable) => {
                        if (variable?.type === 'number' && eachValueComponent.alpha === undefined) {
                            if (negative) {
                                return bypassParsing
                                    ? negateResolvedValue(createCSSVariableReference(variable.name))
                                    : createNegativeNumberVariableReference(variable, unit, this.css.settings.rootSize)
                            }
                            if (!bypassParsing) {
                                return createNumberVariableReference(variable, unit, this.css.settings.rootSize)
                            }
                        }
                        return createCSSVariableReference(variableName, eachValueComponent.alpha, resolveFallback())
                    }
                    if (variable?.inline) {
                        const inlineValue = resolveInlineVariable(variable)
                        currentValue += eachValueComponent.text = eachValueComponent.alpha === undefined
                            ? negative ? negateResolvedValue(inlineValue) : inlineValue
                            : createAlphaColorValue(inlineValue, eachValueComponent.alpha)
                    } else if (variable) {
                        addVariableName(variableName)
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

    stringifyValueComponents(valueComponents: ValueComponent[]) {
        let text = ''
        for (const component of valueComponents) {
            switch (component.type) {
                case 'function':
                    text += component.name
                        + component.symbol
                        + this.stringifyValueComponents(component.children)
                        + VALUE_DELIMITERS[component.symbol as keyof typeof VALUE_DELIMITERS]
                    break
                case 'separator':
                    text += component.value
                    break
                case 'variable':
                    text += component.token || '$' + component.name
                    break
                case 'number':
                    text += component.token || String(component.value) + (component.unit || '')
                    break
                default:
                    text += component.token || component.value
                    break
            }
        }
        return text
    }

    resolveMathFunction(value: string, bypassVariableNames: string[], data?: CoreMathData) {
        const functionName = data?.name ?? 'calc'
        const valueComponents: ValueComponent[] = []
        let i = 0
        const utilityUnit = String()
        const createUnitValueComponents = (): ValueComponent[] => {
            const unitValueComponents: ValueComponent[] = []
            if (utilityUnit === 'rem' || utilityUnit === 'em') {
                unitValueComponents.push(
                    { type: 'separator', value: '/', text: ' / ', token: '/' },
                    { type: 'number', value: this.css.settings.rootSize as number, token: String(this.css.settings.rootSize) }
                )
            }
            unitValueComponents.push(
                { type: 'separator', value: '*', text: ' * ', token: '*' },
                { type: 'number', value: 1, unit: utilityUnit, token: utilityUnit }
            )
            return unitValueComponents
        }
        const getSeparatorValue = (component: ValueComponent | undefined) =>
            component?.type === 'separator' ? component.value : undefined

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
                if (childHasUnit === false && separator !== ' ' && utilityUnit) {
                    childHasUnit = undefined
                    if (!unitChecking) {
                        pushUnitValueComponents()
                    }
                }

                if (current) {
                    if (!isVarFunction) {
                        const result = BASE_UNIT_REGEX.exec(current)
                        if (result) {
                            current = formatMasterBaseUnitValue(
                                +result[1],
                                this.css.settings.baseUnit ?? 1,
                                this.css.settings.rootSize
                            )
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
                if (utilityUnit === 'rem' || utilityUnit === 'em') {
                    currentValueComponents.push(
                        { type: 'separator', value: '/', text: ' / ', token: '/' },
                        { type: 'number', value: this.css.settings.rootSize as number, token: String(this.css.settings.rootSize) }
                    )
                }
                currentValueComponents.push(
                    { type: 'separator', value: '*', text: ' * ', token: '*' },
                    { type: 'number', value: 1, unit: utilityUnit, token: utilityUnit }
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
                    if (nestedFunctionName === '$') {
                        this.invalidValueSyntax = true
                    }
                    const nestedIsVarFunction = nestedFunctionName === 'var'
                    childHasUnit = anaylzeDeeply(
                        newValueComponent.children,
                        nestedIsVarFunction,
                        bypassParsing || nestedIsVarFunction || unitChecking && currentHasUnit,
                        unitChecking,
                        nestedIsVarFunction
                    ) || nestedFunctionName === 'var'
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
                            if (utilityUnit) {
                                unitChecking = true
                            }
                            clear(char, ' ', ' ')
                            break
                        case '/':
                            if (utilityUnit) {
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

        let resolvedValue = this.resolveValue(valueComponents, utilityUnit, bypassVariableNames, true)
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
            && parentFunctionName.endsWith('var')
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
                    const pushVariable = (variableName: string, alpha?: string, token = currentValue, negative?: boolean) => {
                        const valueComponent: VariableValueComponent = { type: 'variable', name: variableName, variable: this.css.variables.get(variableName), token }
                        if (alpha) valueComponent.alpha = Number(alpha)
                        if (negative) valueComponent.negative = true
                        currentValueComponents.push(valueComponent)
                    }
                    const handleVariable = (variableName: string, alpha?: string) => {
                        const resolvedVariableAlias = this.resolveVariableAlias(variableName)
                        if (resolvedVariableAlias && (!resolvedVariableAlias.negative || alpha === undefined)) {
                            const { name, negative } = resolvedVariableAlias
                            if (!bypassVariableNames.includes(name)) {
                                handled = true
                                pushVariable(name, alpha, currentValue, negative)
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
                            currentValue = formatMasterBaseUnitValue(
                                +result[1],
                                this.css.settings.baseUnit ?? 1,
                                this.css.settings.rootSize
                            )
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
                if (val === '(' && functionName === '$') {
                    this.invalidValueSyntax = true
                    return value.length
                }
                const newValueComponent: ValueComponent[][0] = { type: 'function', name: functionName, symbol: val, children: [], token: '' }
                currentValueComponents.push(newValueComponent)
                currentValue = ''
                i = this.parseValues(
                    newValueComponent.children,
                    ++i,
                    value,
                    unit,
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

    parseValue(token: string | number, unit = '') {
        const parsed = parseValue(token, unit, this.css.settings.rootSize)
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
