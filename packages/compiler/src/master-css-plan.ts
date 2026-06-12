import coreConfig from '@master/css/config'
import { extendConfig } from '@master/css/utils'
import UtilityType from 'shared/utility-type'
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
    MasterCSSPlanFunctionOp,
    MasterCSSPlanFunctions,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityEmit,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanUtilityRule
} from 'shared/master-css-plan'

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

function createCompiledUtility(definition: UtilityDefinition, order: number): MasterCSSPlanUtility {
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
    return {
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
}

function compileUtilities(utilities: UtilityDefinitions | undefined): MasterCSSPlanUtility[] | undefined {
    if (!utilities?.length) return
    const entries = utilities.map((definition) => ({ ...definition }))
    const length = entries.length
    return entries
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
        .map((definition, index) => createCompiledUtility(definition, length - 1 - index))
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

export function createMasterCSSPlan(config: Config = {}): MasterCSSPlan {
    const resolved = extendConfig(coreConfig, config)
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
        ...(resolved.variables?.length ? { variables: resolved.variables.map((variable) => ({ ...variable })) } : {}),
        ...(resolved.animations ? { animations: cloneAnimations(resolved.animations) } : {}),
        ...(resolved.variants?.length ? {
            variants: resolved.variants.map((variant) => ({
                ...variant,
                branches: variant.branches.map((branch) => ({
                    ...branch,
                    ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {})
                }))
            }))
        } : {}),
        ...(resolved.utilities?.length ? { utilities: compileUtilities(resolved.utilities) } : {}),
        ...(resolved.functions ? { functions: compileFunctions(resolved.functions) } : {})
    }
}
