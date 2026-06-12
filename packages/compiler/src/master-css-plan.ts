import coreConfig from '@master/css/config'
import { MasterCSS } from '@master/css'
import { extendConfig, parseAt, parseSelector } from '@master/css/utils'
import UtilityType from 'shared/utility-type'
import type { Variable } from 'shared/css-syntax'
import type {
    AnimationDefinitions,
    Config,
    FunctionDefinitions,
    UtilityDefinition,
    UtilityDefinitions,
    UtilityRuleDefinition
} from 'shared/css-config'
import type {
    MasterCSSPlan,
    MasterCSSPlanAnimations,
    MasterCSSPlanAtRule,
    MasterCSSPlanAtRuleNode,
    MasterCSSPlanAtRules,
    MasterCSSPlanFunctionOp,
    MasterCSSPlanFunctions,
    MasterCSSPlanSelectors,
    MasterCSSPlanSelectorNode,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets,
    MasterCSSPlanUtilityEmit,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanUtilityRule,
    MasterCSSPlanVariable,
    MasterCSSPlanVariableAliasSet,
    MasterCSSPlanVariables,
    MasterCSSPlanVariant,
    MasterCSSPlanVariantBranch,
    MasterCSSPlanVariants
} from 'shared/master-css-plan'

type SemanticCSS = InstanceType<typeof MasterCSS>

function naturalCompare(a: string, b: string) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

function cloneDeclarations<T>(declarations: T): T {
    return Array.isArray(declarations)
        ? [...declarations] as T
        : { ...(declarations as object) } as T
}

function cloneRule(rule: UtilityRuleDefinition): MasterCSSPlanUtilityRule {
    return {
        declarations: cloneDeclarations(rule.declarations),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {}),
        ...(rule.selector ? { selector: rule.selector } : {})
    }
}

function compileFunctions(functions: FunctionDefinitions | undefined): MasterCSSPlanFunctions | undefined {
    if (!functions) return
    const compiled: MasterCSSPlanFunctions = {}
    for (const [name, definition] of Object.entries(functions)) {
        compiled[name] = {
            ...(definition.unit !== undefined ? { unit: definition.unit } : {}),
            ...(definition.transformer ? { op: definition.transformer as MasterCSSPlanFunctionOp } : {}),
            ...(definition.transformerOptions !== undefined ? { options: definition.transformerOptions } : {})
        }
    }
    return compiled
}

function compileEmit(definition: UtilityDefinition): MasterCSSPlanUtilityEmit {
    if (definition.declarer === 'pair') {
        return {
            type: 'pair',
            properties: definition.declarerOptions as [string, string]
        }
    }
    if (definition.declarer === 'core.group') {
        return { type: 'group' }
    }
    if (definition.declarer === 'core.variable') {
        return { type: 'css-variable-assignment' }
    }
    if (definition.declarer) {
        throw new Error(`Unsupported MasterCSSPlan declarer opcode: ${definition.declarer}`)
    }
    if (definition.type === UtilityType.Static) {
        const rules: MasterCSSPlanUtilityRule[] = []
        if (definition.declarations) {
            rules.push({
                declarations: cloneDeclarations(definition.declarations) as MasterCSSPlanUtilityRule['declarations'],
                ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {})
            })
        }
        if (definition.rules?.length) {
            rules.push(...definition.rules.map(cloneRule))
        }
        return { type: 'static', rules }
    }
    if (definition.declarations) {
        return Array.isArray(definition.declarations)
            ? { type: 'declarations', declarations: [...definition.declarations] }
            : { type: 'template', declarations: cloneDeclarations(definition.declarations) }
    }
    return { type: 'property', property: definition.name }
}

function compileMatchers(definition: UtilityDefinition, keys: string[]): MasterCSSPlanUtilityMatcher[] {
    const matchers: MasterCSSPlanUtilityMatcher[] = []
    if (definition.type === UtilityType.Static) {
        matchers.push({
            type: 'static',
            name: definition.name.startsWith('.') ? definition.name.slice(1) : definition.name
        })
        return matchers
    }

    const matcher = definition.matcher
    if (matcher) {
        if (definition.name === 'group') {
            matchers.push({ type: 'group' })
            return matchers
        }
        if (definition.name === 'variable') {
            matchers.push({ type: 'css-variable-assignment' })
            return matchers
        }
        throw new Error(`Unsupported MasterCSSPlan matcher opcode for utility: ${definition.name}`)
    }

    if (definition.name.endsWith('()')) {
        matchers.push({ type: 'function-prefix', name: definition.name.slice(0, -2) })
        return matchers
    }

    if (definition.aliasGroups?.length) {
        matchers.push(
            { type: 'variable', keys: [...definition.aliasGroups] },
            { type: 'value', keys: [...definition.aliasGroups] }
        )
    }
    if (keys.length) {
        matchers.push({ type: 'key', keys: [...keys] })
    }
    return matchers
}

function getVariableKeyByNamespace(variableName: string, namespace: string) {
    const negative = variableName.startsWith('-')
    const positiveName = negative ? variableName.slice(1) : variableName
    if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
    const variableKey = positiveName === namespace
        ? ''
        : positiveName.slice(namespace.length + 1)
    return negative ? '-' + variableKey : variableKey
}

const EXACT_VARIABLE_NAMESPACE_PREFIX = '='
const MATCHED_VARIABLE_NAMESPACE_PREFIX = '~'

function createExactVariableNamespaceAliases(variables: MasterCSSPlanVariables | undefined) {
    const variablesByNamespace = new Map<string, MasterCSSPlanVariableAliasSet>()
    if (!variables) return variablesByNamespace
    for (const variable of variables) {
        if (!variable.name || !variable.namespace) continue
        const variableKey = getVariableKeyByNamespace(variable.name, variable.namespace)
        if (variableKey === undefined) continue
        const namespaceVariables = variablesByNamespace.get(variable.namespace)
        if (namespaceVariables) {
            namespaceVariables.push([variableKey, variable.name])
        } else {
            variablesByNamespace.set(variable.namespace, [[variableKey, variable.name]])
        }
    }
    return variablesByNamespace
}

function createMatchedVariableNamespaceAliases(namespace: string, variables: MasterCSSPlanVariables | undefined) {
    const aliases: MasterCSSPlanVariableAliasSet = []
    if (!variables?.length) return
    const usedKeys = new Set<string>()
    for (const variable of variables) {
        if (!variable.name) continue
        const variableKey = getVariableKeyByNamespace(variable.name, namespace)
        if (variableKey !== undefined && !usedKeys.has(variableKey)) {
            usedKeys.add(variableKey)
            aliases.push([variableKey, variable.name])
        }
    }
    return aliases.length ? aliases : undefined
}

function createVariableNamespaces(utilities: UtilityDefinitions | undefined, variables: MasterCSSPlanVariables | undefined) {
    if (!variables?.length) return
    const variableNamespaces: Record<string, MasterCSSPlanVariableAliasSet> = {}
    for (const [namespace, aliases] of createExactVariableNamespaceAliases(variables)) {
        if (aliases.length) variableNamespaces[EXACT_VARIABLE_NAMESPACE_PREFIX + namespace] = aliases
    }
    const matchedNamespaces = new Set<string>()
    for (const utility of utilities || []) {
        for (const namespace of utility.namespaces || []) {
            matchedNamespaces.add(namespace)
        }
    }
    for (const namespace of matchedNamespaces) {
        const aliases = createMatchedVariableNamespaceAliases(namespace, variables)
        if (aliases?.length) variableNamespaces[MATCHED_VARIABLE_NAMESPACE_PREFIX + namespace] = aliases
    }
    return Object.keys(variableNamespaces).length ? variableNamespaces : undefined
}

function compileVariableAliasRefs(
    utility: Pick<MasterCSSPlanUtility, 'name' | 'namespaces' | 'implicitNamespace'>,
    variableNamespaces: Record<string, MasterCSSPlanVariableAliasSet> | undefined
) {
    if (!variableNamespaces) return
    const refs: string[] = []
    const addRef = (ref: string) => {
        if (variableNamespaces[ref]?.length && !refs.includes(ref)) refs.push(ref)
    }
    if (utility.implicitNamespace !== false) addRef(EXACT_VARIABLE_NAMESPACE_PREFIX + utility.name)
    if (utility.namespaces?.length) {
        for (const namespace of [...new Set(utility.namespaces)].sort((a, b) => b.length - a.length)) {
            addRef(MATCHED_VARIABLE_NAMESPACE_PREFIX + namespace)
        }
    }
    return refs.length ? refs : undefined
}

function createCompiledUtility(
    definition: UtilityDefinition,
    order: number,
    variableNamespaces?: Record<string, MasterCSSPlanVariableAliasSet>
): MasterCSSPlanUtility {
    const type = definition.type ?? UtilityType.Normal
    const keys: string[] = []
    let key = definition.key

    if (definition.name.endsWith('()')) {
        key ??= definition.name
    } else if (type === UtilityType.NativeShorthand || type === UtilityType.Native) {
        key ??= definition.name
        keys.push(definition.name)
    }

    if (!definition.matcher && type !== UtilityType.Static) {
        if (!key && !definition.subkey) {
            keys.push(definition.name)
        } else {
            if (key && !keys.includes(key)) keys.push(key)
            if (definition.subkey) keys.push(definition.subkey)
            if (type === UtilityType.Shorthand) keys.push(definition.name)
        }
    }

    const staticName = definition.name.startsWith('.') ? definition.name.slice(1) : definition.name
    const id = type === UtilityType.Static ? '.' + staticName : definition.name
    const utility: MasterCSSPlanUtility = {
        id,
        name: definition.name,
        type,
        order,
        ...(definition.layer ? { layer: definition.layer } : {}),
        ...(key ? { key } : {}),
        ...(definition.subkey ? { subkey: definition.subkey } : {}),
        ...(keys.length ? { keys } : {}),
        ...(definition.aliasGroups?.length ? { aliasGroups: [...definition.aliasGroups] } : {}),
        ...(definition.values?.length ? { values: [...definition.values] } : {}),
        ...(definition.kind ? { kind: definition.kind } : {}),
        ...(definition.namespaces?.length ? { namespaces: [...definition.namespaces] } : {}),
        ...(definition.implicitNamespace !== undefined ? { implicitNamespace: definition.implicitNamespace } : {}),
        separators: definition.separators?.length ? [...definition.separators] : [','],
        unit: definition.unit ?? '',
        ...(definition.includeAnimations ? { includeAnimations: true } : {}),
        ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {}),
        ...(definition.transformer ? { transform: definition.transformer as MasterCSSPlanUtility['transform'] } : {}),
        emit: compileEmit({ ...definition, type }),
        matchers: compileMatchers({ ...definition, type }, keys)
    }
    if (type !== UtilityType.Static) {
        const variableAliasRefs = compileVariableAliasRefs(utility, variableNamespaces)
        if (variableAliasRefs?.length) utility.variableAliasRefs = variableAliasRefs
    }
    return utility
}

function addBucketIndex(bucket: number[] | undefined, index: number) {
    if (bucket?.includes(index)) return bucket
    const nextBucket = bucket || []
    nextBucket.push(index)
    return nextBucket
}

function compileUtilityBuckets(utilities: MasterCSSPlanUtility[]) {
    const buckets: MasterCSSPlanUtilityBuckets = {}
    utilities.forEach((utility, index) => {
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

function internUtilityVariableAliases(utilities: MasterCSSPlanUtility[]) {
    const variableAliasSets: MasterCSSPlanVariableAliasSet[] = []
    const indexes = new Map<string, number>()
    for (const utility of utilities) {
        if (!utility.variableAliases?.length) continue
        const key = JSON.stringify(utility.variableAliases)
        let index = indexes.get(key)
        if (index === undefined) {
            index = variableAliasSets.length
            indexes.set(key, index)
            variableAliasSets.push(utility.variableAliases)
        }
        utility.variableAliasSet = index
        delete utility.variableAliases
    }
    return variableAliasSets.length ? variableAliasSets : undefined
}

function compileUtilities(utilities: UtilityDefinitions | undefined, variables?: MasterCSSPlanVariables) {
    if (!utilities?.length) return {}
    const entries = utilities.map((definition) => ({ ...definition }))
    const length = entries.length
    const variableNamespaces = createVariableNamespaces(entries, variables)
    const compiledUtilities = entries
        .sort((a, b) => {
            if (a.type !== b.type) {
                return (b.type || 0) - (a.type || 0)
            }
            if (a.kind !== b.kind) {
                if (!a.kind) return 1
                if (!b.kind) return -1
                const kindOrder = ['color', 'number', 'image']
                const aKindIndex = kindOrder.indexOf(a.kind)
                const bKindIndex = kindOrder.indexOf(b.kind)
                if (aKindIndex !== bKindIndex) {
                    return aKindIndex - bKindIndex
                }
            }
            return naturalCompare(b.name, a.name)
        })
        .map((definition, index) => createCompiledUtility(definition, length - 1 - index, variableNamespaces))
    const variableAliasSets = internUtilityVariableAliases(compiledUtilities)
    return {
        utilities: compiledUtilities,
        utilityBuckets: compileUtilityBuckets(compiledUtilities),
        variableAliasSets,
        variableNamespaces
    }
}

function cloneAnimations(animations: AnimationDefinitions | undefined): AnimationDefinitions | undefined {
    if (!animations) return
    const cloned: AnimationDefinitions = {}
    for (const [name, keyframes] of Object.entries(animations)) {
        cloned[name] = {}
        for (const [keyframe, declarations] of Object.entries(keyframes)) {
            cloned[name][keyframe] = cloneDeclarations(declarations)
        }
    }
    return cloned
}

function cloneAtRuleNode(node: MasterCSSPlanAtRuleNode): MasterCSSPlanAtRuleNode {
    if ('children' in node) {
        return {
            ...node,
            children: node.children.map(cloneAtRuleNode)
        }
    }
    return { ...node }
}

function cloneAtRule(atRule: MasterCSSPlanAtRule): MasterCSSPlanAtRule {
    return {
        id: atRule.id,
        nodes: atRule.nodes.map(cloneAtRuleNode)
    }
}

function compileAtRules(atRules: SemanticCSS['atRules']): MasterCSSPlanAtRules | undefined {
    if (!atRules.size) return
    const compiled: MasterCSSPlanAtRules = {}
    for (const [name, atRule] of atRules) {
        compiled[name] = cloneAtRule(atRule as MasterCSSPlanAtRule)
    }
    return compiled
}

function cloneSelectorNode(node: MasterCSSPlanSelectorNode): MasterCSSPlanSelectorNode {
    if ('children' in node && node.children?.length) {
        return {
            ...node,
            children: node.children.map(cloneSelectorNode)
        }
    }
    return { ...node }
}

function compileSelectors(selectors: SemanticCSS['selectors']): MasterCSSPlanSelectors | undefined {
    if (!selectors.size) return
    const compiled: MasterCSSPlanSelectors = {}
    for (const [name, nodes] of selectors) {
        compiled[name] = nodes.map((node) => cloneSelectorNode(node as MasterCSSPlanSelectorNode))
    }
    return compiled
}

function compileVariable(variable: Variable): MasterCSSPlanVariable {
    const modes: MasterCSSPlanVariable['modes'] | undefined = variable.modes
        ? Object.fromEntries(
            Object.entries(variable.modes).map(([mode, modeVariable]) => [
                mode,
                {
                    type: modeVariable.type,
                    value: Object.is(modeVariable.value, -0) ? 0 : modeVariable.value
                }
            ])
        )
        : undefined
    const dependencies = variable.dependencies?.size
        ? [...variable.dependencies]
        : undefined
    return {
        name: variable.name,
        key: variable.key,
        ...(variable.namespace ? { namespace: variable.namespace } : {}),
        type: variable.type,
        ...(variable.value !== undefined ? { value: Object.is(variable.value, -0) ? 0 : variable.value } : {}),
        ...(modes ? { modes } : {}),
        ...(dependencies?.length ? { dependencies } : {}),
        ...(variable.inline ? { inline: true } : {})
    }
}

function compileVariables(variables: SemanticCSS['variables']): MasterCSSPlanVariables | undefined {
    if (!variables.size) return
    return [...variables.values()].map(compileVariable)
}

function compileVariantBranch(branch: MasterCSSPlanVariantBranch, css: SemanticCSS): MasterCSSPlanVariantBranch {
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

function compileVariants(variants: SemanticCSS['variants'], css: SemanticCSS): MasterCSSPlanVariants | undefined {
    if (!variants.size) return
    const compiled: MasterCSSPlanVariant[] = []
    for (const [token, branches] of variants) {
        compiled.push({
            token,
            branches: branches.map((branch) => compileVariantBranch(branch as MasterCSSPlanVariantBranch, css))
        })
    }
    return compiled
}

export function createMasterCSSPlan(config: Config = {}): MasterCSSPlan {
    const resolved = extendConfig(coreConfig, config)
    const semanticCSS = new MasterCSS(resolved)
    const variables = compileVariables(semanticCSS.variables)
    const { utilities, utilityBuckets, variableAliasSets, variableNamespaces } = compileUtilities(resolved.utilities, variables)
    const animations = cloneAnimations(resolved.animations) as MasterCSSPlanAnimations | undefined
    const variants = compileVariants(semanticCSS.variants, semanticCSS)
    const atRules = compileAtRules(semanticCSS.atRules)
    const breakpointAtRules = compileAtRules(semanticCSS.breakpointAtRules)
    const containerAtRules = compileAtRules(semanticCSS.containerAtRules)
    const selectors = compileSelectors(semanticCSS.selectors)
    return {
        version: 1,
        settings: {
            ...(resolved.rootSize !== undefined ? { rootSize: resolved.rootSize } : {}),
            ...(resolved.baseUnit !== undefined ? { baseUnit: resolved.baseUnit } : {}),
            ...(resolved.defaultMode !== undefined ? { defaultMode: resolved.defaultMode } : {}),
            ...(resolved.scope !== undefined ? { scope: resolved.scope } : {}),
            ...(resolved.important !== undefined ? { important: resolved.important } : {}),
            ...(resolved.modeTrigger !== undefined ? { modeTrigger: resolved.modeTrigger } : {}),
            ...(resolved.modes?.length ? { modes: [...resolved.modes] } : {})
        },
        ...(variables?.length ? { variables } : {}),
        ...(animations ? { animations } : {}),
        ...(variants?.length ? { variants } : {}),
        ...(atRules ? { atRules } : {}),
        ...(breakpointAtRules ? { breakpointAtRules } : {}),
        ...(containerAtRules ? { containerAtRules } : {}),
        ...(selectors ? { selectors } : {}),
        ...(variableNamespaces ? { variableNamespaces } : {}),
        ...(variableAliasSets?.length ? { variableAliasSets } : {}),
        ...(utilities?.length ? { utilities } : {}),
        ...(utilityBuckets ? { utilityBuckets } : {}),
        ...(resolved.functions ? { functions: compileFunctions(resolved.functions) } : {})
    }
}
