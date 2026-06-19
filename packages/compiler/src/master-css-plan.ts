import UtilityType from 'shared/utility-type'
import type {
    CSSDirectivePlanInput as SharedCSSDirectivePlanInput,
    CSSDirectiveUtilityDefinition,
    CSSDirectiveUtilityDynamicDefinition,
    CSSDirectiveUtilityPatternDefinition,
    CSSDirectiveUtilityRuleDefinition,
    CSSDirectiveVariableDefinition
} from 'shared/css-directives'
import type {
    MasterCSSPlan,
    MasterCSSPlanAnimations,
    MasterCSSPlanAtRule,
    MasterCSSPlanAtRuleNode,
    MasterCSSPlanAtRules,
    MasterCSSPlanCSSDeclarationPrimitive,
    MasterCSSPlanCSSDeclarations,
    MasterCSSPlanNativeValueNamespace,
    MasterCSSPlanNativeValueNamespaces,
    MasterCSSPlanSelectorNode,
    MasterCSSPlanSelectors,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets,
    MasterCSSPlanUtilityRule,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanVariableNumericValue,
    MasterCSSPlanVariable,
    MasterCSSPlanVariables,
    MasterCSSPlanVariant,
    MasterCSSPlanVariantBranch,
    MasterCSSPlanVariants
} from 'shared/master-css-plan'
import {
    createCompilerCSS,
    parseAt,
    parseSelector
} from '@master/css-engine/compiler'
import { isNativeCSSShorthandProperty } from 'shared/native-css-shorthand'

export type CSSDirectivePlanInput = SharedCSSDirectivePlanInput

export interface CreateMasterCSSPlanOptions {
    basePlan?: MasterCSSPlan
}

const CONDITION_VARIABLE_NAMESPACES = ['breakpoint', 'container']
const NUMERIC_THEME_NAMESPACES = new Set(['font-size', 'radius', 'spacing', 'breakpoint', 'container'])
const UNITFUL_NUMERIC_TOKEN = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)?$/

export interface ResolvedCSSDirectiveVariableName {
    name: string
    key: string
    namespace?: string
}

export type CSSDirectiveVariableNameResolver = (variable: CSSDirectiveVariableDefinition) => ResolvedCSSDirectiveVariableName

function clone<T>(value: T): T {
    if (Array.isArray(value)) return value.map((item) => clone(item)) as T
    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {}
        for (const key in value as Record<string, unknown>) {
            result[key] = clone((value as Record<string, unknown>)[key])
        }
        return result as T
    }
    return value
}

function normalizeZero<T>(value: T): T {
    return Object.is(value, -0) ? 0 as T : value
}

function addVariableNamespace(namespaces: Set<string>, namespace: unknown) {
    if (typeof namespace === 'string' && namespace) namespaces.add(namespace)
}

function addVariableAliasRefNamespace(namespaces: Set<string>, ref: unknown) {
    if (typeof ref === 'string' && (ref[0] === '=' || ref[0] === '~')) {
        addVariableNamespace(namespaces, ref.slice(1))
    }
}

function addImplicitUtilityNamespace(namespaces: Set<string>, value: unknown) {
    if (typeof value !== 'string' || !value || value[0] === '.' || value.includes('()')) return
    addVariableNamespace(namespaces, value)
}

function addUtilityVariableNamespaces(namespaces: Set<string>, utilities: (Partial<MasterCSSPlanUtility> | CSSDirectiveUtilityDefinition)[] | undefined) {
    for (const utility of utilities || []) {
        for (const namespace of (utility as Partial<MasterCSSPlanUtility>).namespaces || []) {
            addVariableNamespace(namespaces, namespace)
        }
        for (const ref of (utility as Partial<MasterCSSPlanUtility>).variableAliasRefs || []) {
            addVariableAliasRefNamespace(namespaces, ref)
        }
        if (
            (utility as Partial<MasterCSSPlanUtility>).implicitNamespace !== false
            && (utility as Partial<MasterCSSPlanUtility>).emit?.type === 'property'
        ) {
            addImplicitUtilityNamespace(namespaces, (utility as Partial<MasterCSSPlanUtility>).id)
            addImplicitUtilityNamespace(namespaces, utility.name)
        }
    }
}

function addNativeValueNamespaceVariableNamespaces(namespaces: Set<string>, nativeValueNamespaces: MasterCSSPlanNativeValueNamespaces | undefined) {
    for (const namespace of nativeValueNamespaces || []) {
        for (const ref of namespace.variableAliasRefs || []) {
            addVariableAliasRefNamespace(namespaces, ref)
        }
        for (const property of namespace.properties || []) {
            addImplicitUtilityNamespace(namespaces, property)
        }
    }
}

function collectVariableNamespaces(input: CSSDirectivePlanInput = {}, options: CreateMasterCSSPlanOptions = {}) {
    const namespaces = new Set<string>(CONDITION_VARIABLE_NAMESPACES)
    for (const variable of options.basePlan?.variables || []) {
        addVariableNamespace(namespaces, variable.namespace)
    }
    for (const variable of input.variables || []) {
        addVariableNamespace(namespaces, variable.namespace)
    }
    addUtilityVariableNamespaces(namespaces, options.basePlan?.utilities)
    addUtilityVariableNamespaces(namespaces, input.utilities)
    addNativeValueNamespaceVariableNamespaces(namespaces, options.basePlan?.nativeValueNamespaces)
    addNativeValueNamespaceVariableNamespaces(namespaces, input.nativeValueNamespaces)
    return [...namespaces].sort((a, b) => b.length - a.length || a.localeCompare(b))
}

function resolveVariableName(variable: CSSDirectiveVariableDefinition, namespaces: string[]): ResolvedCSSDirectiveVariableName {
    const explicitName = variable.name?.replace(/^--/, '')
    if (variable.namespace || variable.key !== undefined) {
        const key = variable.key ?? explicitName ?? ''
        const name = variable.namespace
            ? `${variable.namespace}${key ? '-' + key : ''}`
            : key
        return {
            name,
            key,
            ...(variable.namespace ? { namespace: variable.namespace } : {})
        }
    }
    const name = explicitName || ''
    const namespace = namespaces.find((eachNamespace) => name.startsWith(eachNamespace + '-'))
    return namespace
        ? {
            name,
            namespace,
            key: name.slice(namespace.length + 1)
        }
        : {
            name,
            key: name
        }
}

export function createVariableNameResolver(input: CSSDirectivePlanInput = {}, options: CreateMasterCSSPlanOptions = {}): CSSDirectiveVariableNameResolver {
    const namespaces = collectVariableNamespaces(input, options)
    return (variable) => resolveVariableName(variable, namespaces)
}

function getVariableType(value: MasterCSSPlanVariable['value']): NonNullable<MasterCSSPlanVariable['type']> {
    return typeof value === 'number' ? 'number' : 'string'
}

function getVariableNumericValue(
    value: MasterCSSPlanVariable['value'],
    namespace: string | undefined
): MasterCSSPlanVariableNumericValue | undefined {
    if (!namespace || !NUMERIC_THEME_NAMESPACES.has(namespace)) return
    if (typeof value === 'number') {
        return { value }
    }
    if (typeof value !== 'string') return
    const match = UNITFUL_NUMERIC_TOKEN.exec(value.trim())
    if (!match) return
    return {
        value: Number(match[1]),
        ...(match[2] ? { unit: match[2] } : {})
    }
}

function collectVariableDependencies(value: unknown, dependencies = new Set<string>()) {
    if (typeof value !== 'string') return dependencies
    for (const match of value.matchAll(/\$(-?[_a-zA-Z0-9-]+)/g)) {
        dependencies.add(match[1])
    }
    for (const match of value.matchAll(/var\(\s*--(-?[_a-zA-Z0-9-]+)/g)) {
        dependencies.add(match[1])
    }
    return dependencies
}

function variableSlot(variable: Pick<MasterCSSPlanVariable, 'name' | 'namespace' | 'key'>) {
    return variable.name || `${variable.namespace || ''}\0${variable.key}`
}

function pushVariable(target: MasterCSSPlanVariables, variable: MasterCSSPlanVariable) {
    const slot = variableSlot(variable)
    const existing = target.find((eachVariable) => variableSlot(eachVariable) === slot)
    if (existing) {
        Object.assign(existing, variable)
    } else {
        target.push(variable)
    }
}

function compileVariables(
    input: CSSDirectiveVariableDefinition[] | undefined,
    resolveVariableName: CSSDirectiveVariableNameResolver
): MasterCSSPlanVariables | undefined {
    if (!input?.length) return
    const variables: MasterCSSPlanVariables = []
    const byName = new Map<string, MasterCSSPlanVariable>()

    for (const definition of input) {
        const resolved = resolveVariableName(definition)
        if (!resolved.name) continue
        const value = normalizeZero(definition.value) as MasterCSSPlanVariable['value']
        const numeric = getVariableNumericValue(value, resolved.namespace)
        const type = numeric ? 'number' : getVariableType(value)
        const dependencies = collectVariableDependencies(value)

        if (definition.mode) {
            let target = byName.get(resolved.name)
            if (!target) {
                target = {
                    name: resolved.name,
                    key: resolved.key,
                    ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
                    type,
                    modes: {},
                    ...(definition.static ? { static: true } : {})
                }
                byName.set(resolved.name, target)
                pushVariable(variables, target)
            }
            if (definition.static) target.static = true
            target.modes ??= {}
            target.modes[definition.mode] = {
                type,
                value: value as string | number,
                ...(numeric ? { numeric } : {})
            }
            if (dependencies.size) {
                const next = new Set([...(target.dependencies || []), ...dependencies])
                target.dependencies = [...next]
            }
            continue
        }

        const variable: MasterCSSPlanVariable = {
            name: resolved.name,
            key: resolved.key,
            ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
            type,
            value,
            ...(numeric ? { numeric } : {}),
            ...(dependencies.size ? { dependencies: [...dependencies] } : {}),
            ...(definition.inline ? { inline: true } : {}),
            ...(definition.static ? { static: true } : {})
        }
        byName.set(resolved.name, variable)
        pushVariable(variables, variable)
    }

    return variables.length ? variables : undefined
}

function normalizeNumericAtRuleValue(variable: MasterCSSPlanVariable, rootSize: number) {
    if (variable.key.startsWith('-')) return
    const numeric = variable.numeric || (typeof variable.value === 'number' ? { value: variable.value } : undefined)
    if (!numeric) return
    switch (numeric.unit) {
        case undefined:
        case '':
        case 'px':
            return numeric.value / rootSize
        case 'rem':
            return numeric.value
        default:
            return
    }
}

function createVariableAtRule(variable: MasterCSSPlanVariable, id: 'media' | 'container', rootSize: number): MasterCSSPlanAtRule | undefined {
    const value = normalizeNumericAtRuleValue(variable, rootSize)
    if (value === undefined) return
    return {
        id,
        nodes: [{
            type: 'number',
            value,
            unit: 'rem'
        }]
    }
}

function compileAtRules(variables: MasterCSSPlanVariables | undefined, rootSize: number) {
    const atRules: MasterCSSPlanAtRules = {}
    const breakpointAtRules: MasterCSSPlanAtRules = {}
    const containerAtRules: MasterCSSPlanAtRules = {}

    for (const variable of variables || []) {
        if (variable.namespace === 'breakpoint') {
            const atRule = createVariableAtRule(variable, 'media', rootSize)
            if (atRule) {
                atRules[variable.key] = atRule
                breakpointAtRules[variable.key] = atRule
            }
        } else if (variable.namespace === 'container') {
            const atRule = createVariableAtRule(variable, 'container', rootSize)
            if (atRule) {
                containerAtRules[variable.key] = atRule
            }
        }
    }

    return {
        atRules: Object.keys(atRules).length ? atRules : undefined,
        breakpointAtRules: Object.keys(breakpointAtRules).length ? breakpointAtRules : undefined,
        containerAtRules: Object.keys(containerAtRules).length ? containerAtRules : undefined
    }
}

function cloneAtRuleNode(node: MasterCSSPlanAtRuleNode): MasterCSSPlanAtRuleNode {
    return 'children' in node
        ? { ...node, children: node.children.map(cloneAtRuleNode) }
        : { ...node }
}

function cloneAtRule(atRule: MasterCSSPlanAtRule): MasterCSSPlanAtRule {
    return {
        id: atRule.id,
        nodes: atRule.nodes.map(cloneAtRuleNode)
    }
}

function cloneSelectorNode(node: MasterCSSPlanSelectorNode): MasterCSSPlanSelectorNode {
    return 'children' in node && node.children?.length
        ? { ...node, children: node.children.map(cloneSelectorNode) }
        : { ...node }
}

function compileVariantBranch(branch: MasterCSSPlanVariantBranch, css: ReturnType<typeof createCompilerCSS>): MasterCSSPlanVariantBranch {
    const selector = branch.selector?.trim()
    const bodylessSelector = selector
        ? selector.includes('&')
            ? selector.replace(/&/g, '')
            : selector
        : undefined
    const selectorNodes = branch.selectorNodes?.length
        ? branch.selectorNodes.map(cloneSelectorNode)
        : bodylessSelector
            ? parseSelector(bodylessSelector, css, false).map((node) => cloneSelectorNode(node as MasterCSSPlanSelectorNode))
            : undefined
    const atRuleNodes = branch.atRuleNodes?.length
        ? branch.atRuleNodes.map(cloneAtRule)
        : branch.atRules?.length
            ? branch.atRules.map((atRule) => cloneAtRule(parseAt(atRule, css, false) as MasterCSSPlanAtRule))
            : undefined
    return {
        ...branch,
        ...(selectorNodes?.length ? { selectorNodes } : {}),
        ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {}),
        ...(atRuleNodes?.length ? { atRuleNodes } : {})
    }
}

function compileVariants(input: MasterCSSPlanVariants | undefined, basePlan: MasterCSSPlan): {
    variants?: MasterCSSPlanVariants
    selectors?: MasterCSSPlanSelectors
    atRules?: MasterCSSPlanAtRules
} {
    if (!input?.length) return {}
    const css = createCompilerCSS(basePlan)
    const variants: MasterCSSPlanVariant[] = []
    const selectors: MasterCSSPlanSelectors = {}
    const atRules: MasterCSSPlanAtRules = {}
    for (const variant of input) {
        const branches = variant.branches.map((branch) => compileVariantBranch(branch, css))
        variants.push({
            token: variant.token,
            branches
        })
        if (variant.token.startsWith(':')) {
            const firstSelectorNodes = branches.find((branch) => branch.selectorNodes?.length)?.selectorNodes
            if (firstSelectorNodes?.length) selectors[variant.token] = firstSelectorNodes.map(cloneSelectorNode)
        }
        if (variant.token.startsWith('@')) {
            const firstAtRule = branches.find((branch) => branch.atRuleNodes?.length)?.atRuleNodes?.[0]
            if (firstAtRule) {
                atRules[variant.token.slice(1)] = cloneAtRule(firstAtRule)
            } else {
                const firstLayer = branches.find((branch) => branch.layer)?.layer
                if (firstLayer) {
                    atRules[variant.token.slice(1)] = {
                        id: 'layer',
                        nodes: [{
                            type: 'string',
                            value: firstLayer
                        }]
                    }
                }
            }
        }
    }
    return {
        variants,
        ...(Object.keys(selectors).length ? { selectors } : {}),
        ...(Object.keys(atRules).length ? { atRules } : {})
    }
}

function cloneDeclarations<T extends MasterCSSPlanCSSDeclarations>(declarations: T): T {
    return Array.isArray(declarations)
        ? [...declarations] as unknown as T
        : { ...(declarations as object) } as T
}

function assertNoValuePlaceholder(declarations: CSSDirectiveUtilityRuleDefinition['declarations']) {
    for (const property in declarations) {
        if (declarations[property].includes('--value')) {
            throw new Error('--value() is only supported inside managed pattern declarations')
        }
    }
}

function compileUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): MasterCSSPlanUtilityRule {
    assertNoValuePlaceholder(rule.declarations)
    return {
        declarations: cloneDeclarations(rule.declarations),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {}),
        ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
    }
}

const VALUE_PLACEHOLDER_FUNCTION = '--value()'
const VALUE_PLACEHOLDER_CALL = /--value\s*\(([^)]*)\)/g

function compilePatternDeclarationValue(value: string): MasterCSSPlanCSSDeclarationPrimitive | MasterCSSPlanCSSDeclarationPrimitive[] {
    if (!value.includes('--value')) return value

    const parts: (string | null)[] = []
    let lastIndex = 0
    let matched = false
    VALUE_PLACEHOLDER_CALL.lastIndex = 0
    for (const match of value.matchAll(VALUE_PLACEHOLDER_CALL)) {
        matched = true
        if (match[1].trim()) {
            throw new Error('--value() does not accept arguments')
        }
        if (match.index > lastIndex) parts.push(value.slice(lastIndex, match.index))
        parts.push(null)
        lastIndex = match.index + match[0].length
    }

    if (!matched || value.slice(lastIndex).includes('--value')) {
        throw new Error('--value() must be called as --value()')
    }

    if (lastIndex < value.length) parts.push(value.slice(lastIndex))
    return value === VALUE_PLACEHOLDER_FUNCTION ? null : parts
}

function compilePatternDeclarations(declarations: CSSDirectiveUtilityRuleDefinition['declarations']): MasterCSSPlanCSSDeclarations {
    const compiled: Record<string, MasterCSSPlanCSSDeclarationPrimitive | MasterCSSPlanCSSDeclarationPrimitive[]> = {}
    for (const property in declarations) {
        compiled[property] = compilePatternDeclarationValue(declarations[property])
    }
    return compiled
}

function compilePatternUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): MasterCSSPlanUtilityRule {
    return {
        declarations: compilePatternDeclarations(rule.declarations),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {}),
        ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
    }
}

function utilityTypeFromRules(rules: MasterCSSPlanUtilityRule[]) {
    return rules.some(({ declarations }) =>
        Object.keys(declarations).some((property) => isNativeCSSShorthandProperty(property))
    )
        ? UtilityType.Shorthand
        : UtilityType.Normal
}

function getPatternMatcher(pattern: CSSDirectiveUtilityPatternDefinition): MasterCSSPlanUtilityMatcher {
    return {
        type: 'pattern',
        prefix: pattern.prefix,
        values: [...pattern.values]
    }
}

function getDynamicMatchers(dynamic: CSSDirectiveUtilityDynamicDefinition): MasterCSSPlanUtilityMatcher[] {
    const matchers: MasterCSSPlanUtilityMatcher[] = []
    if (dynamic.variableAliasRefs?.length) {
        matchers.push({
            type: 'variable',
            keys: [dynamic.key]
        })
    }
    if (dynamic.kind) {
        matchers.push({
            type: 'value',
            keys: [dynamic.key]
        })
    }
    if (!matchers.length) {
        throw new Error('Managed dynamic utility definition must include at least one value source')
    }
    return matchers
}

function compileUtility(definition: CSSDirectiveUtilityDefinition, order: number): MasterCSSPlanUtility {
    if (definition.type === 'pattern') {
        if (!definition.pattern) {
            throw new Error('Managed enum pattern definition is missing a pattern')
        }
        const rules: MasterCSSPlanUtilityRule[] = []
        if (definition.declarations) {
            rules.push({
                declarations: compilePatternDeclarations(definition.declarations),
                ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {})
            })
        }
        if (definition.rules?.length) {
            rules.push(...definition.rules.map(compilePatternUtilityRule))
        }
        return {
            id: definition.name,
            name: definition.name,
            type: utilityTypeFromRules(rules),
            order,
            layer: definition.layer || 'utilities',
            emit: {
                type: 'static',
                rules
            },
            matchers: [getPatternMatcher(definition.pattern)]
        }
    }

    if (definition.type === 'dynamic') {
        if (!definition.dynamic) {
            throw new Error('Managed dynamic utility definition is missing a dynamic source')
        }
        const rules: MasterCSSPlanUtilityRule[] = []
        if (definition.declarations) {
            rules.push({
                declarations: compilePatternDeclarations(definition.declarations),
                ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {})
            })
        }
        if (definition.rules?.length) {
            rules.push(...definition.rules.map(compilePatternUtilityRule))
        }
        return {
            id: definition.name,
            name: definition.name,
            type: utilityTypeFromRules(rules),
            order,
            layer: definition.layer || 'utilities',
            ...(definition.dynamic.kind ? { kind: definition.dynamic.kind } : {}),
            ...(definition.dynamic.variableAliasRefs?.length ? {
                variableAliasRefs: [...definition.dynamic.variableAliasRefs]
            } : {}),
            emit: {
                type: 'static',
                rules
            },
            matchers: getDynamicMatchers(definition.dynamic)
        }
    }

    const name = definition.name.startsWith('.') ? definition.name.slice(1) : definition.name
    const rules: MasterCSSPlanUtilityRule[] = []
    if (definition.declarations) {
        assertNoValuePlaceholder(definition.declarations)
        rules.push({
            declarations: cloneDeclarations(definition.declarations),
            ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {})
        })
    }
    if (definition.rules?.length) {
        rules.push(...definition.rules.map(compileUtilityRule))
    }
    return {
        id: '.' + name,
        name,
        type: UtilityType.Static,
        order,
        layer: definition.layer || 'utilities',
        emit: {
            type: 'static',
            rules
        },
        matchers: [{
            type: 'static',
            name
        }]
    }
}

function compileUtilities(input: CSSDirectiveUtilityDefinition[] | undefined): MasterCSSPlanUtility[] | undefined {
    if (!input?.length) return
    return input.map((definition, index) => compileUtility(definition, index))
}

function addBucketIndex(bucket: number[] | undefined, index: number) {
    if (bucket?.includes(index)) return bucket
    const nextBucket = bucket || []
    nextBucket.push(index)
    return nextBucket
}

function compileUtilityBuckets(utilities: MasterCSSPlanUtility[] | undefined): MasterCSSPlanUtilityBuckets | undefined {
    const buckets: MasterCSSPlanUtilityBuckets = {}
    utilities?.forEach((utility, index) => {
        for (const matcher of utility.matchers) {
            switch (matcher.type) {
                case 'variable':
                    if (utility.variableAliases?.length || utility.variableAliasRefs?.length) {
                        buckets.variable = addBucketIndex(buckets.variable, index)
                    }
                    break
                case 'value':
                    if (utility.kind) buckets.value = addBucketIndex(buckets.value, index)
                    break
                case 'key':
                    buckets.key = addBucketIndex(buckets.key, index)
                    break
                case 'pattern':
                    buckets.pattern = addBucketIndex(buckets.pattern, index)
                    break
                default:
                    buckets.arbitrary = addBucketIndex(buckets.arbitrary, index)
                    break
            }
        }
    })
    return Object.keys(buckets).length ? buckets : undefined
}

function compileAnimations(input: CSSDirectivePlanInput['animations']): MasterCSSPlanAnimations | undefined {
    return input ? clone(input) as MasterCSSPlanAnimations : undefined
}

function compileAnimationOptions(input: CSSDirectivePlanInput['animationOptions']): MasterCSSPlan['animationOptions'] | undefined {
    return input ? clone(input) as MasterCSSPlan['animationOptions'] : undefined
}

function mergeBy<T>(base: T[] | undefined, next: T[] | undefined, getKey: (value: T) => string | undefined) {
    const merged = [...(base || []).map((value) => clone(value))]
    for (const value of next || []) {
        const key = getKey(value)
        const index = key === undefined ? -1 : merged.findIndex((existing) => getKey(existing) === key)
        if (index === -1) {
            merged.push(clone(value))
        } else {
            merged[index] = clone(value)
        }
    }
    return merged.length ? merged : undefined
}

function mergeRecords<T>(base: Record<string, T> | undefined, next: Record<string, T> | undefined) {
    return Object.keys(base || {}).length || Object.keys(next || {}).length
        ? { ...(base ? clone(base) : {}), ...(next ? clone(next) : {}) }
        : undefined
}

function getNativeValueNamespaceKey(namespace: Pick<MasterCSSPlanNativeValueNamespace, 'variableAliasRefs'>) {
    return JSON.stringify({
        variableAliasRefs: namespace.variableAliasRefs || []
    })
}

function mergeNativeValueNamespaces(
    base: MasterCSSPlanNativeValueNamespaces | undefined,
    next: MasterCSSPlanNativeValueNamespaces | undefined
): MasterCSSPlanNativeValueNamespaces | undefined {
    if (!base?.length && !next?.length) return

    const byProperty = new Map<string, Pick<MasterCSSPlanNativeValueNamespace, 'variableAliasRefs'>>()
    for (const namespace of [...(base || []), ...(next || [])]) {
        for (const property of namespace.properties || []) {
            byProperty.set(property, {
                variableAliasRefs: [...(namespace.variableAliasRefs || [])]
            })
        }
    }

    const groups = new Map<string, MasterCSSPlanNativeValueNamespace>()
    for (const [property, namespace] of byProperty) {
        const key = getNativeValueNamespaceKey(namespace)
        const group = groups.get(key)
        if (group) {
            group.properties.push(property)
        } else {
            groups.set(key, {
                properties: [property],
                variableAliasRefs: [...namespace.variableAliasRefs]
            })
        }
    }
    return groups.size ? [...groups.values()] : undefined
}

function mergeAnimationOptions(
    base: MasterCSSPlan['animationOptions'],
    next: MasterCSSPlan['animationOptions'],
    animations: MasterCSSPlan['animations']
) {
    const merged = mergeRecords(base, next)
    if (!merged) return
    for (const animationName of Object.keys(animations || {})) {
        if (!next?.[animationName]) {
            delete merged[animationName]
        }
    }
    return Object.keys(merged).length ? merged : undefined
}

function utilityKeys(utility: MasterCSSPlanUtility) {
    const keys = new Set([utility.id, utility.name].filter(Boolean))
    for (const matcher of utility.matchers || []) {
        if (matcher.type === 'key') {
            matcher.keys.forEach((key) => keys.add(key))
        }
    }
    return keys
}

function addVariableAliasRef(utility: MasterCSSPlanUtility, ref: string) {
    utility.variableAliasRefs ??= []
    if (!utility.variableAliasRefs.includes(ref)) utility.variableAliasRefs.push(ref)
}

function addNativeValueNamespaceAliasRef(
    namespace: MasterCSSPlanNativeValueNamespace,
    property: string,
    groups: Map<string, MasterCSSPlanNativeValueNamespace>,
    namespaces: Set<string>
) {
    const variableAliasRefs = [...(namespace.variableAliasRefs || [])]
    const ref = '=' + property
    if (namespaces.has(property) && !variableAliasRefs.includes(ref)) {
        variableAliasRefs.push(ref)
    }

    const key = getNativeValueNamespaceKey({
        variableAliasRefs
    })
    const group = groups.get(key)
    if (group) {
        group.properties.push(property)
    } else {
        groups.set(key, {
            properties: [property],
            variableAliasRefs
        })
    }
}

function addNativeValueNamespaceOwnVariableRefs(plan: MasterCSSPlan, namespaces: Set<string>) {
    if (!plan.nativeValueNamespaces?.length) return
    const groups = new Map<string, MasterCSSPlanNativeValueNamespace>()
    for (const namespace of plan.nativeValueNamespaces) {
        for (const property of namespace.properties || []) {
            addNativeValueNamespaceAliasRef(namespace, property, groups, namespaces)
        }
    }
    plan.nativeValueNamespaces = groups.size ? [...groups.values()] : undefined
}

function addOwnNamespaceVariableRefs(plan: MasterCSSPlan) {
    const namespaces = new Set<string>()
    for (const variable of plan.variables || []) {
        if (variable.namespace) namespaces.add(variable.namespace)
    }
    if (!namespaces.size) return

    for (const utility of plan.utilities || []) {
        const keys = utilityKeys(utility)
        for (const namespace of namespaces) {
            if (keys.has(namespace)) addVariableAliasRef(utility, '=' + namespace)
        }
    }
    addNativeValueNamespaceOwnVariableRefs(plan, namespaces)
}

function mergePlan(basePlan: MasterCSSPlan | undefined, fragment: MasterCSSPlan): MasterCSSPlan {
    if (!basePlan) {
        const plan = clone(fragment)
        addOwnNamespaceVariableRefs(plan)
        plan.utilityBuckets = compileUtilityBuckets(plan.utilities)
        return plan
    }

    const plan: MasterCSSPlan = {
        version: 2,
        settings: { ...(basePlan.settings || {}), ...(fragment.settings || {}) },
        variables: mergeBy(basePlan.variables, fragment.variables, (variable) => variable.name),
        animations: mergeRecords(basePlan.animations, fragment.animations),
        animationOptions: mergeAnimationOptions(basePlan.animationOptions, fragment.animationOptions, fragment.animations),
        variants: mergeBy(basePlan.variants, fragment.variants, (variant) => variant.token),
        atRules: mergeRecords(basePlan.atRules, fragment.atRules),
        breakpointAtRules: mergeRecords(basePlan.breakpointAtRules, fragment.breakpointAtRules),
        containerAtRules: mergeRecords(basePlan.containerAtRules, fragment.containerAtRules),
        selectors: mergeRecords(basePlan.selectors, fragment.selectors),
        utilities: mergeBy(basePlan.utilities, fragment.utilities, (utility) => `${utility.id}\0${utility.layer || ''}`),
        keyAliases: mergeRecords(basePlan.keyAliases, fragment.keyAliases),
        nativeValueNamespaces: mergeNativeValueNamespaces(basePlan.nativeValueNamespaces, fragment.nativeValueNamespaces),
        debug: mergeRecords(basePlan.debug, fragment.debug)
    }
    addOwnNamespaceVariableRefs(plan)
    plan.utilityBuckets = compileUtilityBuckets(plan.utilities)
    return Object.fromEntries(Object.entries(plan).filter(([, value]) =>
        value !== undefined
        && (!Array.isArray(value) || value.length)
        && (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length)
    )) as MasterCSSPlan
}

export function createMasterCSSPlan(input: CSSDirectivePlanInput = {}, options: CreateMasterCSSPlanOptions = {}): MasterCSSPlan {
    const rootSize = input.rootSize ?? options.basePlan?.settings?.rootSize ?? 16
    const resolveVariableName = createVariableNameResolver(input, options)
    const variables = compileVariables(input.variables, resolveVariableName)
    const { atRules, breakpointAtRules, containerAtRules } = compileAtRules(variables, rootSize)
    const settings = {
        ...(input.rootSize !== undefined ? { rootSize: input.rootSize } : {}),
        ...(input.baseUnit !== undefined ? { baseUnit: input.baseUnit } : {}),
        ...(input.defaultMode !== undefined ? { defaultMode: input.defaultMode } : {}),
        ...(input.scope !== undefined ? { scope: input.scope } : {}),
        ...(input.important !== undefined ? { important: input.important } : {}),
        ...(input.modeTrigger !== undefined ? { modeTrigger: input.modeTrigger } : {}),
        ...(input.modes?.length ? { modes: [...input.modes] } : {})
    }
    const variantBasePlan = mergePlan(options.basePlan, {
        version: 2,
        ...(Object.keys(settings).length ? { settings } : {}),
        ...(variables?.length ? { variables } : {}),
        ...(atRules ? { atRules } : {}),
        ...(breakpointAtRules ? { breakpointAtRules } : {}),
        ...(containerAtRules ? { containerAtRules } : {})
    })
    const { variants, selectors, atRules: variantAtRules } = compileVariants(input.variants as MasterCSSPlanVariants | undefined, variantBasePlan)
    const utilities = compileUtilities(input.utilities)
    const animations = compileAnimations(input.animations)
    const animationOptions = compileAnimationOptions(input.animationOptions)
    const fragment: MasterCSSPlan = {
        version: 2,
        ...(Object.keys(settings).length ? { settings } : {}),
        ...(variables?.length ? { variables } : {}),
        ...(animations ? { animations } : {}),
        ...(animationOptions ? { animationOptions } : {}),
        ...(variants?.length ? { variants } : {}),
        ...((atRules || variantAtRules) ? { atRules: mergeRecords(atRules, variantAtRules) } : {}),
        ...(breakpointAtRules ? { breakpointAtRules } : {}),
        ...(containerAtRules ? { containerAtRules } : {}),
        ...(selectors ? { selectors } : {}),
        ...(utilities?.length ? { utilities } : {}),
        ...(input.keyAliases ? { keyAliases: input.keyAliases } : {}),
        ...(input.nativeValueNamespaces?.length ? { nativeValueNamespaces: input.nativeValueNamespaces } : {})
    }
    return mergePlan(options.basePlan, fragment)
}
