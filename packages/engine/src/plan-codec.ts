import UtilityType from 'shared/utility-type'
import type {
    MasterCSSPlan,
    MasterCSSPlanCSSDeclarations,
    MasterCSSPlanVariable,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityEmit,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanUtilityRule
} from 'shared/master-css-plan'

type EncodedRule = [
    declarations: MasterCSSPlanUtilityRule['declarations'],
    atRules?: string[] | null,
    selector?: string
]

type EncodedCSSDeclarationPrimitive = string | number | null
type EncodedCSSDeclarationValue = EncodedCSSDeclarationPrimitive | EncodedCSSDeclarationPrimitive[]
type EncodedCSSDeclarations = Record<string, EncodedCSSDeclarationValue>

type EncodedEmit =
    | null
    | undefined
    | ['s', EncodedRule[]]
    | ['d', string[]]
    | ['t', EncodedCSSDeclarations]
    | ['p', [string, string]]
    | ['g']
    | ['v']
    | ['r', string]

type EncodedMatcher =
    | ['s', string]
    | ['k', string[]]
    | ['V', string[]]
    | ['v', string[]]
    | ['f', string]
    | ['g']
    | ['c']

type EncodedMeta = {
    l?: MasterCSSPlanUtility['layer']
    k?: string
    s?: string
    K?: string[]
    a?: string[]
    v?: string[]
    m?: MasterCSSPlanUtility['kind']
    n?: string[]
    i?: boolean
    r?: string[]
    u?: string
    A?: true
    R?: string[]
    T?: MasterCSSPlanUtility['transform']
    x?: [string, string][]
    X?: number
    Y?: string[]
    M?: EncodedMatcher[]
}

type EncodedUtility = [
    name: string,
    type: MasterCSSPlanUtility['type'],
    emit?: EncodedEmit,
    meta?: EncodedMeta
]

type EncodedVariable = [
    key: string,
    value: MasterCSSPlanVariable['value'] | null,
    namespace?: string | null,
    name?: string | null,
    type?: MasterCSSPlanVariable['type'] | null,
    inline?: true | null,
    dependencies?: string[] | null,
    modes?: Record<string, [NonNullable<MasterCSSPlanVariable['type']>, string | number]>
]

type EncodedVariableAliasSet = [key: string, variable: number | string][]

export type EncodedMasterCSSPlan = Omit<MasterCSSPlan, 'utilities' | 'variables' | 'variableAliasSets' | 'variableNamespaces'> & {
    __compact?: 1
    variables?: EncodedVariable[] | MasterCSSPlanVariable[]
    variableNamespaces?: Record<string, EncodedVariableAliasSet> | MasterCSSPlan['variableNamespaces']
    variableAliasSets?: EncodedVariableAliasSet[] | MasterCSSPlan['variableAliasSets']
    utilities?: EncodedUtility[] | MasterCSSPlanUtility[]
}

function encodeRule(rule: MasterCSSPlanUtilityRule): EncodedRule {
    const encoded: EncodedRule = [rule.declarations]
    if (rule.atRules?.length || rule.selector) encoded.push(rule.atRules || null)
    if (rule.selector) encoded.push(rule.selector)
    return encoded
}

function encodeTemplateDeclarations(declarations: MasterCSSPlanCSSDeclarations): EncodedCSSDeclarations {
    const encoded: EncodedCSSDeclarations = {}
    const declarationMap = declarations as Record<string, unknown>
    for (const propertyName in declarationMap) {
        const propertyValue = declarationMap[propertyName]
        encoded[propertyName] = Array.isArray(propertyValue)
            ? propertyValue.map((value) => value === undefined ? null : value) as EncodedCSSDeclarationPrimitive[]
            : propertyValue === undefined
                ? null
                : propertyValue as EncodedCSSDeclarationPrimitive
    }
    return encoded
}

function encodeEmit(utility: MasterCSSPlanUtility): EncodedEmit {
    const emit = utility.emit
    switch (emit.type) {
        case 'property':
            return emit.property === utility.name ? undefined : ['r', emit.property]
        case 'static':
            return ['s', emit.rules.map(encodeRule)]
        case 'declarations':
            return ['d', emit.declarations]
        case 'template':
            return ['t', encodeTemplateDeclarations(emit.declarations)]
        case 'pair':
            return ['p', emit.properties]
        case 'group':
            return ['g']
        case 'css-variable-assignment':
            return ['v']
    }
}

function encodeMatcher(matcher: MasterCSSPlanUtilityMatcher): EncodedMatcher {
    switch (matcher.type) {
        case 'static':
            return ['s', matcher.name]
        case 'key':
            return ['k', matcher.keys]
        case 'variable':
            return ['V', matcher.keys]
        case 'value':
            return ['v', matcher.keys]
        case 'function-prefix':
            return ['f', matcher.name]
        case 'group':
            return ['g']
        case 'css-variable-assignment':
            return ['c']
    }
}

function encodeUtility(utility: MasterCSSPlanUtility): EncodedUtility {
    const meta: EncodedMeta = {}
    if (utility.layer) meta.l = utility.layer
    if (utility.values?.length) meta.v = utility.values
    if (utility.kind) meta.m = utility.kind
    if (utility.separators?.length && !(utility.separators.length === 1 && utility.separators[0] === ',')) meta.r = utility.separators
    if (utility.unit) meta.u = utility.unit
    if (utility.includeAnimations) meta.A = true
    if (utility.atRules?.length) meta.R = utility.atRules
    if (utility.transform) meta.T = utility.transform
    if (utility.variableAliases?.length) meta.x = utility.variableAliases
    if (utility.variableAliasSet !== undefined) meta.X = utility.variableAliasSet
    if (utility.variableAliasRefs?.length) meta.Y = utility.variableAliasRefs
    if (utility.matchers?.length) meta.M = utility.matchers.map(encodeMatcher)
    const emit = encodeEmit(utility)
    const encoded: EncodedUtility = [utility.name, utility.type]
    if (emit !== undefined || Object.keys(meta).length) encoded.push(emit || null)
    if (Object.keys(meta).length) encoded.push(meta)
    return encoded
}

function getDefaultVariableName(key: string, namespace?: string | null) {
    const negative = key.startsWith('-')
    const positiveKey = negative ? key.slice(1) : key
    const name = namespace
        ? `${namespace}${positiveKey ? '-' + positiveKey : ''}`
        : positiveKey
    return negative ? '-' + name : name
}

function inferVariableType(value: MasterCSSPlanVariable['value'] | null | undefined, modes?: MasterCSSPlanVariable['modes']) {
    if (typeof value === 'number') return 'number'
    const firstMode = modes && Object.values(modes)[0]
    return firstMode?.type || 'string'
}

function encodeVariable(variable: MasterCSSPlanVariable): EncodedVariable {
    const modes = variable.modes
        ? Object.fromEntries(
            Object.entries(variable.modes).map(([mode, modeVariable]) => [
                mode,
                [modeVariable.type, modeVariable.value]
            ])
        ) as NonNullable<EncodedVariable[7]>
        : undefined
    const encoded: EncodedVariable = [
        variable.key,
        variable.value === undefined ? null : variable.value,
        variable.namespace || null,
        variable.name && variable.name !== getDefaultVariableName(variable.key, variable.namespace) ? variable.name : null,
        variable.type && variable.type !== inferVariableType(variable.value, variable.modes) ? variable.type : null,
        variable.inline ? true : null,
        variable.dependencies?.length ? variable.dependencies : null,
        modes
    ]
    while (encoded.length > 2 && (encoded[encoded.length - 1] === undefined || encoded[encoded.length - 1] === null)) {
        encoded.pop()
    }
    return encoded
}

function createVariableIndexes(plan: MasterCSSPlan) {
    const variableIndexes = new Map<string, number>()
    plan.variables?.forEach((variable, index) => {
        if (variable.name) variableIndexes.set(variable.name, index)
    })
    return variableIndexes
}

function encodeVariableAliasSet(aliasSet: [string, string][], variableIndexes: Map<string, number>): EncodedVariableAliasSet {
    return aliasSet.map(([key, name]) => [key, variableIndexes.get(name) ?? name])
}

function encodeVariableNamespaces(plan: MasterCSSPlan, variableIndexes: Map<string, number>) {
    if (!plan.variableNamespaces) return
    const encoded: Record<string, EncodedVariableAliasSet> = {}
    for (const [namespace, aliasSet] of Object.entries(plan.variableNamespaces)) {
        encoded[namespace] = encodeVariableAliasSet(aliasSet, variableIndexes)
    }
    return encoded
}

function encodeVariableAliasSets(plan: MasterCSSPlan, variableIndexes: Map<string, number>): EncodedVariableAliasSet[] | undefined {
    if (!plan.variableAliasSets?.length) return
    return plan.variableAliasSets.map((aliasSet) =>
        encodeVariableAliasSet(aliasSet, variableIndexes)
    )
}

export function encodeMasterCSSPlan(plan: MasterCSSPlan): EncodedMasterCSSPlan {
    const variableIndexes = createVariableIndexes(plan)
    return {
        ...plan,
        __compact: 1,
        ...(plan.variables?.length ? { variables: plan.variables.map(encodeVariable) } : {}),
        ...(plan.variableNamespaces ? { variableNamespaces: encodeVariableNamespaces(plan, variableIndexes) } : {}),
        ...(plan.variableAliasSets?.length ? { variableAliasSets: encodeVariableAliasSets(plan, variableIndexes) } : {}),
        ...(plan.utilities?.length ? { utilities: plan.utilities.map(encodeUtility) } : {})
    }
}

function decodeRule(rule: EncodedRule): MasterCSSPlanUtilityRule {
    return {
        declarations: rule[0],
        ...(rule[1]?.length ? { atRules: rule[1] } : {}),
        ...(rule[2] ? { selector: rule[2] } : {})
    }
}

function decodeTemplateDeclarations(declarations: EncodedCSSDeclarations): MasterCSSPlanCSSDeclarations {
    const decoded: Record<string, unknown> = {}
    for (const propertyName in declarations) {
        const propertyValue = declarations[propertyName]
        decoded[propertyName] = Array.isArray(propertyValue)
            ? propertyValue.map((value) => value === null ? undefined : value)
            : propertyValue === null
                ? undefined
                : propertyValue
    }
    return decoded as MasterCSSPlanCSSDeclarations
}

function decodeEmit(name: string, type: MasterCSSPlanUtility['type'], emit: EncodedEmit): MasterCSSPlanUtilityEmit {
    if (!emit) {
        return { type: 'property', property: name }
    }
    switch (emit[0]) {
        case 's':
            return { type: 'static', rules: emit[1].map(decodeRule) }
        case 'd':
            return { type: 'declarations', declarations: emit[1] }
        case 't':
            return { type: 'template', declarations: decodeTemplateDeclarations(emit[1]) }
        case 'p':
            return { type: 'pair', properties: emit[1] }
        case 'g':
            return { type: 'group' }
        case 'v':
            return { type: 'css-variable-assignment' }
        case 'r':
            return { type: 'property', property: emit[1] }
    }
    return type === UtilityType.Static
        ? { type: 'static', rules: [] }
        : { type: 'property', property: name }
}

function decodeMatcher(matcher: EncodedMatcher): MasterCSSPlanUtilityMatcher {
    switch (matcher[0]) {
        case 's':
            return { type: 'static', name: matcher[1] }
        case 'k':
            return { type: 'key', keys: matcher[1] }
        case 'V':
            return { type: 'variable', keys: matcher[1] }
        case 'v':
            return { type: 'value', keys: matcher[1] }
        case 'f':
            return { type: 'function-prefix', name: matcher[1] }
        case 'g':
            return { type: 'group' }
        case 'c':
            return { type: 'css-variable-assignment' }
    }
}

function decodeUtility(encoded: EncodedUtility, index: number, length: number): MasterCSSPlanUtility {
    const [name, type, emit, meta = {}] = encoded
    const key = meta.k || (name.endsWith('()') ? name : undefined)
    return {
        id: type === UtilityType.Static ? '.' + (name.startsWith('.') ? name.slice(1) : name) : name,
        name,
        type,
        order: length - 1 - index,
        ...(meta.l ? { layer: meta.l } : {}),
        ...(key ? { key } : {}),
        ...(meta.s ? { subkey: meta.s } : {}),
        ...(meta.K?.length ? { keys: meta.K } : {}),
        ...(meta.a?.length ? { aliasGroups: meta.a } : {}),
        ...(meta.v?.length ? { values: meta.v } : {}),
        ...(meta.m ? { kind: meta.m } : {}),
        ...(meta.n?.length ? { namespaces: meta.n } : {}),
        ...(meta.i !== undefined ? { implicitNamespace: meta.i } : {}),
        ...(meta.r?.length ? { separators: meta.r } : {}),
        ...(meta.u !== undefined ? { unit: meta.u } : {}),
        ...(meta.A ? { includeAnimations: true } : {}),
        ...(meta.R?.length ? { atRules: meta.R } : {}),
        ...(meta.T ? { transform: meta.T } : {}),
        ...(meta.x?.length ? { variableAliases: meta.x } : {}),
        ...(meta.X !== undefined ? { variableAliasSet: meta.X } : {}),
        ...(meta.Y?.length ? { variableAliasRefs: meta.Y } : {}),
        emit: decodeEmit(name, type, emit),
        matchers: meta.M?.length ? meta.M.map(decodeMatcher) : []
    }
}

function decodeVariable(encoded: EncodedVariable): MasterCSSPlanVariable {
    const modes = encoded[7]
        ? Object.fromEntries(
            Object.entries(encoded[7]).map(([mode, [type, value]]) => [
                mode,
                { type, value }
            ])
        ) as NonNullable<MasterCSSPlanVariable['modes']>
        : undefined
    return {
        key: encoded[0],
        ...(encoded[1] !== null ? { value: encoded[1] } : {}),
        ...(encoded[2] ? { namespace: encoded[2] } : {}),
        name: encoded[3] || getDefaultVariableName(encoded[0], encoded[2]),
        type: encoded[4] || inferVariableType(encoded[1], modes),
        ...(encoded[5] ? { inline: true } : {}),
        ...(encoded[6]?.length ? { dependencies: encoded[6] } : {}),
        ...(modes ? { modes } : {})
    }
}

function decodeVariableAliasSets(
    encodedVariableAliasSets: EncodedVariableAliasSet[] | undefined,
    variables: MasterCSSPlanVariable[] | undefined
): MasterCSSPlan['variableAliasSets'] | undefined {
    if (!encodedVariableAliasSets?.length) return
    return encodedVariableAliasSets.map((aliasSet) => decodeVariableAliasSet(aliasSet, variables))
}

function decodeVariableAliasSet(
    aliasSet: EncodedVariableAliasSet,
    variables: MasterCSSPlanVariable[] | undefined
) {
    return aliasSet.map(([key, variable]) => [
        key,
        typeof variable === 'number'
            ? variables?.[variable]?.name || ''
            : variable
    ] as [string, string])
}

function decodeVariableNamespaces(
    encodedVariableNamespaces: Record<string, EncodedVariableAliasSet> | undefined,
    variables: MasterCSSPlanVariable[] | undefined
): MasterCSSPlan['variableNamespaces'] | undefined {
    if (!encodedVariableNamespaces) return
    const decoded: NonNullable<MasterCSSPlan['variableNamespaces']> = {}
    for (const [namespace, aliasSet] of Object.entries(encodedVariableNamespaces)) {
        decoded[namespace] = decodeVariableAliasSet(aliasSet, variables)
    }
    return decoded
}

export function decodeMasterCSSPlan(plan: EncodedMasterCSSPlan): MasterCSSPlan {
    if (!plan.__compact) return plan as MasterCSSPlan
    const { __compact: _compact, utilities, variables, variableNamespaces, variableAliasSets, ...rest } = plan
    const encodedUtilities = utilities as EncodedUtility[] | undefined
    const encodedVariables = variables as EncodedVariable[] | undefined
    const decodedVariables = encodedVariables?.length ? encodedVariables.map(decodeVariable) : undefined
    return {
        ...rest,
        version: 1,
        ...(decodedVariables?.length ? { variables: decodedVariables } : {}),
        ...(variableNamespaces ? {
            variableNamespaces: decodeVariableNamespaces(variableNamespaces as Record<string, EncodedVariableAliasSet>, decodedVariables)
        } : {}),
        ...(variableAliasSets?.length ? {
            variableAliasSets: decodeVariableAliasSets(variableAliasSets as EncodedVariableAliasSet[], decodedVariables)
        } : {}),
        ...(encodedUtilities?.length ? {
            utilities: encodedUtilities.map((utility, index) => decodeUtility(utility, index, encodedUtilities.length))
        } : {})
    }
}
