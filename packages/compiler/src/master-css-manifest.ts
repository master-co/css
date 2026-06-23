import UtilityType from '@master/css-schema/utility-type'
import type {
    CSSDirectiveManifestInput as SharedCSSDirectiveManifestInput,
    CSSDirectiveUtilityDefinition,
    CSSDirectiveUtilityDynamicDefinition,
    CSSDirectiveUtilityPatternDefinition,
    CSSDirectiveUtilityRuleDefinition,
    CSSDirectiveVariableDefinition
} from '@master/css-schema/css-directives'
import type {
    MasterCSSManifest,
    MasterCSSManifestAnimations,
    MasterCSSManifestAtRule,
    MasterCSSManifestAtRuleNode,
    MasterCSSManifestAtRules,
    MasterCSSManifestCSSDeclarationPrimitive,
    MasterCSSManifestCSSDeclarations,
    MasterCSSManifestSelectorNode,
    MasterCSSManifestSelectors,
    MasterCSSManifestUtility,
    MasterCSSManifestUtilityRule,
    MasterCSSManifestUtilityMatcher,
    MasterCSSManifestVariableNumericValue,
    MasterCSSManifestVariable,
    MasterCSSManifestVariables,
    MasterCSSManifestVariant,
    MasterCSSManifestVariantBranch,
    MasterCSSManifestVariants
} from '@master/css-schema/manifest'
import { flattenMasterCSSManifestVariables, groupMasterCSSManifestVariables } from '@master/css-schema/manifest'
import {
    createCompilerCSS,
    parseAt,
    parseSelector
} from '@master/css-engine/compiler'
import { builtinNamespaces } from '@master/css-engine'
import { isNativeCSSShorthandProperty } from '@master/css-schema/native-css-shorthand'

export type CSSDirectiveManifestInput = SharedCSSDirectiveManifestInput

export interface CreateMasterCSSManifestOptions {
    baseManifest?: MasterCSSManifest
}

const NUMERIC_THEME_NAMESPACES = new Set(['font-size', 'radius', 'spacing', 'breakpoint', 'container'])
const UNITFUL_NUMERIC_TOKEN = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)?$/

export interface ResolvedCSSDirectiveVariableName {
    name: string
    key: string
    namespace?: string
}

export type CSSDirectiveVariableNameResolver = (variable: CSSDirectiveVariableDefinition) => ResolvedCSSDirectiveVariableName
type MasterCSSManifestVariableDraft = MasterCSSManifestVariable & { namespace?: string }

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

function addUtilityVariableNamespaces(namespaces: Set<string>, utilities: (Partial<MasterCSSManifestUtility> | CSSDirectiveUtilityDefinition)[] | undefined) {
    for (const utility of utilities || []) {
        for (const namespace of (utility as Partial<MasterCSSManifestUtility>).namespaces || []) {
            addVariableNamespace(namespaces, namespace)
        }
        for (const ref of (utility as Partial<MasterCSSManifestUtility>).variableAliasRefs || []) {
            addVariableAliasRefNamespace(namespaces, ref)
        }
        if (
            (utility as Partial<MasterCSSManifestUtility>).implicitNamespace !== false
            && (utility as Partial<MasterCSSManifestUtility>).emit?.type === 'property'
        ) {
            addImplicitUtilityNamespace(namespaces, (utility as Partial<MasterCSSManifestUtility>).id)
            addImplicitUtilityNamespace(namespaces, utility.name)
        }
    }
}

function collectVariableNamespaces(input: CSSDirectiveManifestInput = {}, options: CreateMasterCSSManifestOptions = {}) {
    const namespaces = new Set<string>(builtinNamespaces)
    for (const variable of flattenMasterCSSManifestVariables(options.baseManifest?.variables)) {
        addVariableNamespace(namespaces, variable.namespace)
    }
    for (const variable of input.variables || []) {
        addVariableNamespace(namespaces, variable.namespace)
    }
    addUtilityVariableNamespaces(namespaces, options.baseManifest?.utilities)
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

export function createVariableNameResolver(input: CSSDirectiveManifestInput = {}, options: CreateMasterCSSManifestOptions = {}): CSSDirectiveVariableNameResolver {
    const namespaces = collectVariableNamespaces(input, options)
    return (variable) => resolveVariableName(variable, namespaces)
}

function getVariableType(value: MasterCSSManifestVariable['value']): NonNullable<MasterCSSManifestVariable['type']> {
    return typeof value === 'number' ? 'number' : 'string'
}

function getVariableNumericValue(
    value: MasterCSSManifestVariable['value'],
    namespace: string | undefined
): MasterCSSManifestVariableNumericValue | undefined {
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

function variableSlot(variable: Pick<MasterCSSManifestVariable, 'name' | 'namespace' | 'key'>) {
    return variable.name || `${variable.namespace || ''}\0${variable.key}`
}

function pushVariable(target: MasterCSSManifestVariableDraft[], variable: MasterCSSManifestVariableDraft) {
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
): MasterCSSManifestVariableDraft[] | undefined {
    if (!input?.length) return
    const variables: MasterCSSManifestVariableDraft[] = []
    const byName = new Map<string, MasterCSSManifestVariableDraft>()

    for (const definition of input) {
        const resolved = resolveVariableName(definition)
        if (!resolved.name) continue
        const value = normalizeZero(definition.value) as MasterCSSManifestVariable['value']
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

        const variable: MasterCSSManifestVariableDraft = {
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

function normalizeNumericAtRuleValue(variable: MasterCSSManifestVariable, rootSize: number) {
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

function createVariableAtRule(variable: MasterCSSManifestVariable, id: 'media' | 'container', rootSize: number): MasterCSSManifestAtRule | undefined {
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

function compileAtRules(variables: MasterCSSManifestVariableDraft[] | undefined, rootSize: number) {
    const atRules: MasterCSSManifestAtRules = {}
    const breakpointAtRules: MasterCSSManifestAtRules = {}
    const containerAtRules: MasterCSSManifestAtRules = {}

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

function cloneAtRuleNode(node: MasterCSSManifestAtRuleNode): MasterCSSManifestAtRuleNode {
    return 'children' in node
        ? { ...node, children: node.children.map(cloneAtRuleNode) }
        : { ...node }
}

function cloneAtRule(atRule: MasterCSSManifestAtRule): MasterCSSManifestAtRule {
    return {
        id: atRule.id,
        nodes: atRule.nodes.map(cloneAtRuleNode)
    }
}

function cloneSelectorNode(node: MasterCSSManifestSelectorNode): MasterCSSManifestSelectorNode {
    return 'children' in node && node.children?.length
        ? { ...node, children: node.children.map(cloneSelectorNode) }
        : { ...node }
}

function compileVariantBranch(branch: MasterCSSManifestVariantBranch, css: ReturnType<typeof createCompilerCSS>): MasterCSSManifestVariantBranch {
    const selector = branch.selector?.trim()
    const bodylessSelector = selector
        ? selector.includes('&')
            ? selector.replace(/&/g, '')
            : selector
        : undefined
    const selectorNodes = branch.selectorNodes?.length
        ? branch.selectorNodes.map(cloneSelectorNode)
        : bodylessSelector
            ? parseSelector(bodylessSelector, css, false).map((node) => cloneSelectorNode(node as MasterCSSManifestSelectorNode))
            : undefined
    const atRuleNodes = branch.atRuleNodes?.length
        ? branch.atRuleNodes.map(cloneAtRule)
        : branch.atRules?.length
            ? branch.atRules.map((atRule) => cloneAtRule(parseAt(atRule, css, false) as MasterCSSManifestAtRule))
            : undefined
    return {
        ...branch,
        ...(selectorNodes?.length ? { selectorNodes } : {}),
        ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {}),
        ...(atRuleNodes?.length ? { atRuleNodes } : {})
    }
}

function compileVariants(input: MasterCSSManifestVariants | undefined, baseManifest: MasterCSSManifest): {
    variants?: MasterCSSManifestVariants
    selectors?: MasterCSSManifestSelectors
    atRules?: MasterCSSManifestAtRules
} {
    if (!input?.length) return {}
    const css = createCompilerCSS(baseManifest)
    const variants: MasterCSSManifestVariant[] = []
    const selectors: MasterCSSManifestSelectors = {}
    const atRules: MasterCSSManifestAtRules = {}
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

function cloneDeclarations<T extends MasterCSSManifestCSSDeclarations>(declarations: T): T {
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

function compileUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): MasterCSSManifestUtilityRule {
    assertNoValuePlaceholder(rule.declarations)
    return {
        declarations: cloneDeclarations(rule.declarations),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {}),
        ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
    }
}

const VALUE_PLACEHOLDER_FUNCTION = '--value()'
const VALUE_PLACEHOLDER_CALL = /--value\s*\(([^)]*)\)/g

function compilePatternDeclarationValue(value: string): MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[] {
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

function compilePatternDeclarations(declarations: CSSDirectiveUtilityRuleDefinition['declarations']): MasterCSSManifestCSSDeclarations {
    const compiled: Record<string, MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[]> = {}
    for (const property in declarations) {
        compiled[property] = compilePatternDeclarationValue(declarations[property])
    }
    return compiled
}

function compilePatternUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): MasterCSSManifestUtilityRule {
    return {
        declarations: compilePatternDeclarations(rule.declarations),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {}),
        ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
    }
}

function declarationValueUsesPlaceholder(value: MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[]) {
    return value === null || (Array.isArray(value) && value.includes(null))
}

function countValuePlaceholderProperties(declarations: MasterCSSManifestCSSDeclarations) {
    let count = 0
    const declarationMap = declarations as Record<string, MasterCSSManifestCSSDeclarationPrimitive | MasterCSSManifestCSSDeclarationPrimitive[]>
    for (const property in declarationMap) {
        if (declarationValueUsesPlaceholder(declarationMap[property])) count++
    }
    return count
}

function utilityTypeFromRules(rules: MasterCSSManifestUtilityRule[]) {
    return rules.some(({ declarations }) => {
        const properties = Object.keys(declarations)
        return properties.some((property) => isNativeCSSShorthandProperty(property))
            || countValuePlaceholderProperties(declarations) > 1
    })
        ? UtilityType.Shorthand
        : UtilityType.Normal
}

function getPatternMatcher(pattern: CSSDirectiveUtilityPatternDefinition): MasterCSSManifestUtilityMatcher {
    return {
        type: 'pattern',
        prefix: pattern.prefix,
        values: [...pattern.values]
    }
}

function getDynamicMatchers(dynamic: CSSDirectiveUtilityDynamicDefinition): MasterCSSManifestUtilityMatcher[] {
    const matchers: MasterCSSManifestUtilityMatcher[] = []
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
    if (dynamic.arbitrary) {
        matchers.push({
            type: 'key',
            keys: [dynamic.key]
        })
    }
    if (dynamic.values?.length) {
        matchers.push({
            type: 'pattern',
            prefix: dynamic.key + ':',
            values: [...dynamic.values]
        })
    }
    if (!matchers.length) {
        throw new Error('Managed dynamic utility definition must include at least one value source')
    }
    return matchers
}

function compileUtility(definition: CSSDirectiveUtilityDefinition, order: number): MasterCSSManifestUtility {
    if (definition.type === 'pattern') {
        if (!definition.pattern) {
            throw new Error('Managed enum pattern definition is missing a pattern')
        }
        const rules: MasterCSSManifestUtilityRule[] = []
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
            type: UtilityType.Semantic,
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
        const rules: MasterCSSManifestUtilityRule[] = []
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
    const rules: MasterCSSManifestUtilityRule[] = []
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
        type: UtilityType.Semantic,
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

function compileUtilities(input: CSSDirectiveUtilityDefinition[] | undefined): MasterCSSManifestUtility[] | undefined {
    if (!input?.length) return
    return input.map((definition, index) => compileUtility(definition, index))
}

function compileAnimations(input: CSSDirectiveManifestInput['animations']): MasterCSSManifestAnimations | undefined {
    return input ? clone(input) as MasterCSSManifestAnimations : undefined
}

function compileAnimationOptions(input: CSSDirectiveManifestInput['animationOptions']): MasterCSSManifest['animationOptions'] | undefined {
    return input ? clone(input) as MasterCSSManifest['animationOptions'] : undefined
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

function mergeVariables(
    base: MasterCSSManifestVariables | undefined,
    next: MasterCSSManifestVariables | undefined
) {
    const merged = mergeBy(
        flattenMasterCSSManifestVariables(base),
        flattenMasterCSSManifestVariables(next),
        (variable) => variable.name
    )
    return groupMasterCSSManifestVariables(merged)
}

function mergeRecords<T>(base: Record<string, T> | undefined, next: Record<string, T> | undefined) {
    return Object.keys(base || {}).length || Object.keys(next || {}).length
        ? { ...(base ? clone(base) : {}), ...(next ? clone(next) : {}) }
        : undefined
}

function mergeAnimationOptions(
    base: MasterCSSManifest['animationOptions'],
    next: MasterCSSManifest['animationOptions'],
    animations: MasterCSSManifest['animations']
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

function mergeManifest(baseManifest: MasterCSSManifest | undefined, fragment: MasterCSSManifest): MasterCSSManifest {
    if (!baseManifest) {
        return clone(fragment)
    }

    const manifest: MasterCSSManifest = {
        version: 1,
        settings: { ...(baseManifest.settings || {}), ...(fragment.settings || {}) },
        variables: mergeVariables(baseManifest.variables, fragment.variables),
        animations: mergeRecords(baseManifest.animations, fragment.animations),
        animationOptions: mergeAnimationOptions(baseManifest.animationOptions, fragment.animationOptions, fragment.animations),
        variants: mergeBy(baseManifest.variants, fragment.variants, (variant) => variant.token),
        atRules: mergeRecords(baseManifest.atRules, fragment.atRules),
        breakpointAtRules: mergeRecords(baseManifest.breakpointAtRules, fragment.breakpointAtRules),
        containerAtRules: mergeRecords(baseManifest.containerAtRules, fragment.containerAtRules),
        selectors: mergeRecords(baseManifest.selectors, fragment.selectors),
        utilities: mergeBy(baseManifest.utilities, fragment.utilities, (utility) => `${utility.id}\0${utility.layer || ''}`),
        debug: mergeRecords(baseManifest.debug, fragment.debug)
    }
    return Object.fromEntries(Object.entries(manifest).filter(([, value]) =>
        value !== undefined
        && (!Array.isArray(value) || value.length)
        && (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length)
    )) as MasterCSSManifest
}

export function createMasterCSSManifest(input: CSSDirectiveManifestInput = {}, options: CreateMasterCSSManifestOptions = {}): MasterCSSManifest {
    const rootSize = input.rootSize ?? options.baseManifest?.settings?.rootSize ?? 16
    const resolveVariableName = createVariableNameResolver(input, options)
    const variableDefinitions = compileVariables(input.variables, resolveVariableName)
    const variables = groupMasterCSSManifestVariables(variableDefinitions)
    const { atRules, breakpointAtRules, containerAtRules } = compileAtRules(variableDefinitions, rootSize)
    const settings = {
        ...(input.rootSize !== undefined ? { rootSize: input.rootSize } : {}),
        ...(input.baseUnit !== undefined ? { baseUnit: input.baseUnit } : {}),
        ...(input.defaultMode !== undefined ? { defaultMode: input.defaultMode } : {}),
        ...(input.scope !== undefined ? { scope: input.scope } : {}),
        ...(input.important !== undefined ? { important: input.important } : {}),
        ...(input.modeTrigger !== undefined ? { modeTrigger: input.modeTrigger } : {}),
        ...(input.modes?.length ? { modes: [...input.modes] } : {})
    }
    const variantBaseManifest = mergeManifest(options.baseManifest, {
        version: 1,
        ...(Object.keys(settings).length ? { settings } : {}),
        ...(variables ? { variables } : {}),
        ...(atRules ? { atRules } : {}),
        ...(breakpointAtRules ? { breakpointAtRules } : {}),
        ...(containerAtRules ? { containerAtRules } : {})
    })
    const { variants, selectors, atRules: variantAtRules } = compileVariants(input.variants as MasterCSSManifestVariants | undefined, variantBaseManifest)
    const utilities = compileUtilities(input.utilities)
    const animations = compileAnimations(input.animations)
    const animationOptions = compileAnimationOptions(input.animationOptions)
    const fragment: MasterCSSManifest = {
        version: 1,
        ...(Object.keys(settings).length ? { settings } : {}),
        ...(variables ? { variables } : {}),
        ...(animations ? { animations } : {}),
        ...(animationOptions ? { animationOptions } : {}),
        ...(variants?.length ? { variants } : {}),
        ...((atRules || variantAtRules) ? { atRules: mergeRecords(atRules, variantAtRules) } : {}),
        ...(breakpointAtRules ? { breakpointAtRules } : {}),
        ...(containerAtRules ? { containerAtRules } : {}),
        ...(selectors ? { selectors } : {}),
        ...(utilities?.length ? { utilities } : {})
    }
    return mergeManifest(options.baseManifest, fragment)
}
