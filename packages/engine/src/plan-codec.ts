import UtilityType from 'shared/utility-type'
import type {
    MasterCSSPlan,
    MasterCSSPlanVariable,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityEmit,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanUtilityRule
} from 'shared/master-css-plan'

type EncodedRule = [
    declarations: MasterCSSPlanUtilityRule['declarations'],
    atRules?: string[],
    selector?: string
]

type EncodedEmit =
    | undefined
    | ['s', EncodedRule[]]
    | ['d', string[]]
    | ['t', MasterCSSPlanUtilityRule['declarations']]
    | ['p', [string, string]]
    | ['g']
    | ['v']
    | ['r', string]

type EncodedMeta = {
    l?: MasterCSSPlanUtility['layer']
    k?: string
    s?: string
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
}

type EncodedUtility = [
    name: string,
    type: MasterCSSPlanUtility['type'],
    emit?: EncodedEmit,
    meta?: EncodedMeta
]

type EncodedVariable = [
    key: string,
    value: MasterCSSPlanVariable['value'],
    namespace?: string,
    mode?: string,
    inline?: true
]

type EncodedMasterCSSPlan = Omit<MasterCSSPlan, 'utilities' | 'variables'> & {
    __compact?: 1
    variables?: EncodedVariable[] | MasterCSSPlanVariable[]
    utilities?: EncodedUtility[] | MasterCSSPlanUtility[]
}

function decodeRule(rule: EncodedRule): MasterCSSPlanUtilityRule {
    return {
        declarations: rule[0],
        ...(rule[1]?.length ? { atRules: rule[1] } : {}),
        ...(rule[2] ? { selector: rule[2] } : {})
    }
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
            return { type: 'template', declarations: emit[1] }
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

function compileMatchers(utility: MasterCSSPlanUtility): MasterCSSPlanUtilityMatcher[] {
    if (utility.type === UtilityType.Static) {
        return [{
            type: 'static',
            name: utility.name.startsWith('.') ? utility.name.slice(1) : utility.name
        }]
    }
    if (utility.name === 'group') return [{ type: 'group' }]
    if (utility.name === 'variable') return [{ type: 'css-variable-assignment' }]
    if (utility.name.endsWith('()')) return [{ type: 'function-prefix', name: utility.name.slice(0, -2) }]

    const matchers: MasterCSSPlanUtilityMatcher[] = []
    if (utility.aliasGroups?.length) {
        matchers.push(
            { type: 'variable', keys: utility.aliasGroups },
            { type: 'value', keys: utility.aliasGroups }
        )
    }
    const keys = utility.keys || []
    if (keys.length) matchers.push({ type: 'key', keys })
    return matchers
}

function resolveKeys(name: string, type: MasterCSSPlanUtility['type'], key?: string, subkey?: string) {
    const keys: string[] = []
    if (name.endsWith('()')) {
        return keys
    }
    if (type === UtilityType.NativeShorthand || type === UtilityType.Native) {
        keys.push(name)
        key ??= name
    }
    if (type !== UtilityType.Static) {
        if (!key && !subkey) {
            if (!keys.includes(name)) keys.push(name)
        } else {
            if (key && !keys.includes(key)) keys.push(key)
            if (subkey) keys.push(subkey)
            if (type === UtilityType.Shorthand && !keys.includes(name)) keys.push(name)
        }
    }
    return keys
}

function decodeUtility(encoded: EncodedUtility, index: number, length: number): MasterCSSPlanUtility {
    const [name, type, emit, meta = {}] = encoded
    const key = meta.k || (name.endsWith('()') ? name : undefined)
    const keys = resolveKeys(name, type, key, meta.s)
    const utility: MasterCSSPlanUtility = {
        id: type === UtilityType.Static ? '.' + (name.startsWith('.') ? name.slice(1) : name) : name,
        name,
        type,
        order: length - 1 - index,
        ...(meta.l ? { layer: meta.l } : {}),
        ...(key ? { key } : {}),
        ...(meta.s ? { subkey: meta.s } : {}),
        ...(keys.length ? { keys } : {}),
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
        emit: decodeEmit(name, type, emit),
        matchers: []
    }
    utility.matchers = compileMatchers(utility)
    return utility
}

function decodeVariable(encoded: EncodedVariable): MasterCSSPlanVariable {
    return {
        key: encoded[0],
        value: encoded[1],
        ...(encoded[2] ? { namespace: encoded[2] } : {}),
        ...(encoded[3] ? { mode: encoded[3] } : {}),
        ...(encoded[4] ? { inline: true } : {})
    }
}

export function decodeMasterCSSPlan(plan: EncodedMasterCSSPlan): MasterCSSPlan {
    if (!plan.__compact) return plan as MasterCSSPlan
    const { __compact: _compact, utilities, variables, ...rest } = plan
    const encodedUtilities = utilities as EncodedUtility[] | undefined
    const encodedVariables = variables as EncodedVariable[] | undefined
    return {
        ...rest,
        version: 1,
        ...(encodedVariables?.length ? { variables: encodedVariables.map(decodeVariable) } : {}),
        ...(encodedUtilities?.length ? {
            utilities: encodedUtilities.map((utility, index) => decodeUtility(utility, index, encodedUtilities.length))
        } : {})
    }
}
