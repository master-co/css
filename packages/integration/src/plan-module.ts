import path from 'node:path'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import { VIRTUAL_CONFIG_DIR } from './config-module'

export type { MasterCSSPlan }

export const VIRTUAL_PLAN_ID = 'virtual:master-css-plan'
export const MASTER_CSS_PLAN_QUERY = '?master-css-plan'
export const RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX = '\0master-css-plan:'
export const VIRTUAL_PLAN_FILE = 'master-css-plan.js'
export const EMPTY_PLAN_MODULE = 'export default { version: 1 };'

export interface CSSPlanLoadResult {
    plan: MasterCSSPlan
    dependencies: string[]
    classNames?: string[]
    nativeClassNames?: string[]
    nativeCSS?: string
    css?: string
    generatedCSS?: string
    warnings?: string[]
}

export type CSSPlanModuleResult = CSSPlanLoadResult & {
    code: string
}

export function isMasterCSSPlanRequest(id: string) {
    return id.endsWith(MASTER_CSS_PLAN_QUERY)
}

export function stripMasterCSSPlanQuery(id: string) {
    return isMasterCSSPlanRequest(id)
        ? id.slice(0, -MASTER_CSS_PLAN_QUERY.length)
        : id
}

function compactUtilityRule(rule: { declarations: unknown, atRules?: string[], selector?: string }) {
    return [
        rule.declarations,
        ...(rule.atRules?.length || rule.selector ? [rule.atRules] : []),
        ...(rule.selector ? [rule.selector] : [])
    ]
}

function compactEmit(utility: NonNullable<MasterCSSPlan['utilities']>[number]) {
    const emit = utility.emit
    switch (emit.type) {
        case 'property':
            return emit.property === utility.name ? undefined : ['r', emit.property]
        case 'static':
            return ['s', emit.rules.map(compactUtilityRule)]
        case 'declarations':
            return ['d', emit.declarations]
        case 'template':
            return ['t', emit.declarations]
        case 'pair':
            return ['p', emit.properties]
        case 'group':
            return ['g']
        case 'css-variable-assignment':
            return ['v']
    }
}

function compactUtility(utility: NonNullable<MasterCSSPlan['utilities']>[number]) {
    const meta: Record<string, unknown> = {}
    if (utility.layer) meta.l = utility.layer
    if (utility.key && !(utility.name.endsWith('()') && utility.key === utility.name)) meta.k = utility.key
    if (utility.subkey) meta.s = utility.subkey
    if (utility.aliasGroups?.length) meta.a = utility.aliasGroups
    if (utility.values?.length) meta.v = utility.values
    if (utility.kind) meta.m = utility.kind
    if (utility.namespaces?.length) meta.n = utility.namespaces
    if (utility.implicitNamespace !== undefined) meta.i = utility.implicitNamespace
    if (utility.separators?.length && !(utility.separators.length === 1 && utility.separators[0] === ',')) meta.r = utility.separators
    if (utility.unit) meta.u = utility.unit
    if (utility.includeAnimations) meta.A = true
    if (utility.atRules?.length) meta.R = utility.atRules
    if (utility.transform) meta.T = utility.transform
    const emit = compactEmit(utility)
    return [
        utility.name,
        utility.type,
        ...(emit || Object.keys(meta).length ? [emit] : []),
        ...(Object.keys(meta).length ? [meta] : [])
    ]
}

function compactVariable(variable: NonNullable<MasterCSSPlan['variables']>[number]) {
    return [
        variable.key,
        variable.value,
        ...(variable.namespace || variable.mode || variable.inline ? [variable.namespace] : []),
        ...(variable.mode || variable.inline ? [variable.mode] : []),
        ...(variable.inline ? [true] : [])
    ]
}

function compactMasterCSSPlan(plan: MasterCSSPlan) {
    return {
        ...plan,
        __compact: 1,
        ...(plan.variables?.length ? { variables: plan.variables.map(compactVariable) } : {}),
        ...(plan.utilities?.length ? { utilities: plan.utilities.map(compactUtility) } : {})
    }
}

export function toPlanModule(plan: MasterCSSPlan) {
    return [
        `import { decodeMasterCSSPlan } from '@master/css-engine/plan-codec';`,
        `export default decodeMasterCSSPlan(${JSON.stringify(compactMasterCSSPlan(plan))});`
    ].join('\n')
}

export function toPlanModuleResult<T extends CSSPlanLoadResult>(result: T): T & { code: string } {
    return {
        ...result,
        code: toPlanModule(result.plan)
    }
}

export function toResolvedMasterCSSPlanId(file: string) {
    return RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX + Buffer.from(file).toString('base64url')
}

export function fromResolvedMasterCSSPlanId(id: string) {
    return id.startsWith(RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX)
        ? Buffer.from(id.slice(RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX.length), 'base64url').toString()
        : undefined
}

export function toVirtualDefaultPlanModulePath(context: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, VIRTUAL_PLAN_FILE)
}

function encodeVirtualFilename(id: string) {
    return Buffer.from(id).toString('base64url')
}

export function toVirtualCSSPlanModulePath(context: string, file: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, `${encodeVirtualFilename(file)}.plan.js`)
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createVirtualDefaultPlanModulePathPattern() {
    const source = [...VIRTUAL_CONFIG_DIR.split('/'), VIRTUAL_PLAN_FILE]
        .map(escapeRegExp)
        .join(String.raw`[/\\]`)
    return new RegExp(String.raw`(?:^|[/\\])${source}$`)
}
