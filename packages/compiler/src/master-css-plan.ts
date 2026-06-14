import UtilityType from 'shared/utility-type'
import type {
    CSSDirectivePlanInput as SharedCSSDirectivePlanInput,
    CSSDirectiveUtilityDefinition,
    CSSDirectiveUtilityRuleDefinition,
    CSSDirectiveVariableDefinition
} from 'shared/css-directives'
import type {
    MasterCSSPlan,
    MasterCSSPlanAnimations,
    MasterCSSPlanAtRule,
    MasterCSSPlanAtRuleNode,
    MasterCSSPlanAtRules,
    MasterCSSPlanCSSDeclarations,
    MasterCSSPlanSelectorNode,
    MasterCSSPlanSelectors,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets,
    MasterCSSPlanUtilityRule,
    MasterCSSPlanVariable,
    MasterCSSPlanVariableAliasSet,
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

export type CSSDirectivePlanInput = SharedCSSDirectivePlanInput

export interface CreateMasterCSSPlanOptions {
    basePlan?: MasterCSSPlan
}

const CONDITION_VARIABLE_NAMESPACES = ['breakpoint', 'container']

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
            && (utility.type === UtilityType.Native || utility.type === UtilityType.NativeShorthand)
        ) {
            addImplicitUtilityNamespace(namespaces, (utility as Partial<MasterCSSPlanUtility>).id)
            addImplicitUtilityNamespace(namespaces, utility.name)
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
    for (const ref of Object.keys(options.basePlan?.variableNamespaces || {})) {
        addVariableAliasRefNamespace(namespaces, ref)
    }
    addUtilityVariableNamespaces(namespaces, options.basePlan?.utilities)
    addUtilityVariableNamespaces(namespaces, input.utilities)
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
        const type = getVariableType(value)
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
            target.modes[definition.mode] = { type, value: value as string | number }
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
            ...(dependencies.size ? { dependencies: [...dependencies] } : {}),
            ...(definition.inline ? { inline: true } : {}),
            ...(definition.static ? { static: true } : {})
        }
        byName.set(resolved.name, variable)
        pushVariable(variables, variable)

        if (typeof value === 'number' && !resolved.key.startsWith('-')) {
            const negativeName = resolved.namespace
                ? `-${resolved.namespace}-${resolved.key}`
                : '-' + resolved.key
            pushVariable(variables, {
                name: negativeName,
                key: '-' + resolved.key,
                ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
                type: 'number',
                value: normalizeZero(-value),
                ...(definition.inline ? { inline: true } : {}),
                ...(definition.static ? { static: true } : {})
            })
        }
    }

    return variables.length ? variables : undefined
}

function createVariableAtRule(variable: MasterCSSPlanVariable, id: 'media' | 'container', rootSize: number): MasterCSSPlanAtRule | undefined {
    if (typeof variable.value !== 'number' || variable.key.startsWith('-')) return
    return {
        id,
        nodes: [{
            type: 'number',
            value: variable.value / rootSize,
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

function compileUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): MasterCSSPlanUtilityRule {
    return {
        declarations: cloneDeclarations(rule.declarations),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {}),
        ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
    }
}

function compileUtility(definition: CSSDirectiveUtilityDefinition, order: number): MasterCSSPlanUtility {
    const name = definition.name.startsWith('.') ? definition.name.slice(1) : definition.name
    const rules: MasterCSSPlanUtilityRule[] = []
    if (definition.declarations) {
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
                    if (utility.variableAliases?.length || utility.variableAliasSet !== undefined || utility.variableAliasRefs?.length) {
                        buckets.variable = addBucketIndex(buckets.variable, index)
                    }
                    break
                case 'value':
                    if (utility.values?.length || utility.kind) buckets.value = addBucketIndex(buckets.value, index)
                    break
                case 'key':
                    buckets.key = addBucketIndex(buckets.key, index)
                    break
                default:
                    buckets.arbitrary = addBucketIndex(buckets.arbitrary, index)
                    break
            }
        }
    })
    return Object.keys(buckets).length ? buckets : undefined
}

function getVariableKeyByNamespace(variableName: string, namespace: string) {
    const negative = variableName.startsWith('-')
    const positiveName = negative ? variableName.slice(1) : variableName
    if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
    const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
    return negative ? '-' + key : key
}

function createVariableNamespaces(plan: MasterCSSPlan) {
    const namespaces = new Set<string>()
    for (const variable of plan.variables || []) {
        if (variable.namespace) namespaces.add(variable.namespace)
    }
    for (const utility of plan.utilities || []) {
        for (const ref of utility.variableAliasRefs || []) {
            if (ref[0] === '~' || ref[0] === '=') namespaces.add(ref.slice(1))
        }
    }

    const variableNamespaces: Record<string, MasterCSSPlanVariableAliasSet> = {}
    for (const namespace of namespaces) {
        const aliases: MasterCSSPlanVariableAliasSet = []
        const usedKeys = new Set<string>()
        for (const variable of plan.variables || []) {
            if (!variable.name) continue
            const key = getVariableKeyByNamespace(variable.name, namespace)
            if (key === undefined || usedKeys.has(key)) continue
            usedKeys.add(key)
            aliases.push([key, variable.name])
        }
        if (aliases.length) {
            variableNamespaces['=' + namespace] = aliases
            variableNamespaces['~' + namespace] = aliases
        }
    }
    return Object.keys(variableNamespaces).length ? variableNamespaces : undefined
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
}

function mergePlan(basePlan: MasterCSSPlan | undefined, fragment: MasterCSSPlan): MasterCSSPlan {
    if (!basePlan) {
        const plan = clone(fragment)
        addOwnNamespaceVariableRefs(plan)
        plan.utilityBuckets = compileUtilityBuckets(plan.utilities)
        plan.variableNamespaces = createVariableNamespaces(plan)
        return plan
    }

    const plan: MasterCSSPlan = {
        version: 1,
        settings: { ...(basePlan.settings || {}), ...(fragment.settings || {}) },
        variables: mergeBy(basePlan.variables, fragment.variables, (variable) => variable.name),
        animations: mergeRecords(basePlan.animations, fragment.animations),
        animationOptions: mergeAnimationOptions(basePlan.animationOptions, fragment.animationOptions, fragment.animations),
        variants: mergeBy(basePlan.variants, fragment.variants, (variant) => variant.token),
        atRules: mergeRecords(basePlan.atRules, fragment.atRules),
        breakpointAtRules: mergeRecords(basePlan.breakpointAtRules, fragment.breakpointAtRules),
        containerAtRules: mergeRecords(basePlan.containerAtRules, fragment.containerAtRules),
        selectors: mergeRecords(basePlan.selectors, fragment.selectors),
        variableAliasSets: basePlan.variableAliasSets ? clone(basePlan.variableAliasSets) : undefined,
        utilities: mergeBy(basePlan.utilities, fragment.utilities, (utility) => `${utility.id}\0${utility.layer || ''}`),
        functions: mergeRecords(basePlan.functions, fragment.functions),
        debug: mergeRecords(basePlan.debug, fragment.debug)
    }
    addOwnNamespaceVariableRefs(plan)
    plan.utilityBuckets = compileUtilityBuckets(plan.utilities)
    plan.variableNamespaces = createVariableNamespaces(plan)
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
        version: 1,
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
        version: 1,
        ...(Object.keys(settings).length ? { settings } : {}),
        ...(variables?.length ? { variables } : {}),
        ...(animations ? { animations } : {}),
        ...(animationOptions ? { animationOptions } : {}),
        ...(variants?.length ? { variants } : {}),
        ...((atRules || variantAtRules) ? { atRules: mergeRecords(atRules, variantAtRules) } : {}),
        ...(breakpointAtRules ? { breakpointAtRules } : {}),
        ...(containerAtRules ? { containerAtRules } : {}),
        ...(selectors ? { selectors } : {}),
        ...(utilities?.length ? { utilities } : {})
    }
    return mergePlan(options.basePlan, fragment)
}
