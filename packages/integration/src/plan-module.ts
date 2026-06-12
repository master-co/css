import path from 'node:path'
import type { MasterCSSPlan } from 'shared/master-css-plan'

export type { MasterCSSPlan }

export const VIRTUAL_PLAN_ID = 'virtual:master-css-plan'
export const MASTER_CSS_PLAN_QUERY = '?master-css-plan'
export const RESOLVED_MASTER_CSS_PLAN_QUERY_PREFIX = '\0master-css-plan:'
export const VIRTUAL_MODULE_DIR = 'node_modules/.master-css'
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

export function stripResourceQuery(resourcePath: string) {
    return resourcePath.replace(/[?#].*$/, '')
}

type PlanUtility = NonNullable<MasterCSSPlan['utilities']>[number]

function normalizeTemplateDeclarations(declarations: Record<string, unknown>) {
    const normalized: Record<string, unknown> = {}
    for (const propertyName in declarations) {
        const value = declarations[propertyName]
        normalized[propertyName] = Array.isArray(value)
            ? value.map((part) => part === undefined ? null : part)
            : value === undefined
                ? null
                : value
    }
    return normalized
}

function normalizeUtilityForJSON(utility: PlanUtility): PlanUtility {
    if (utility.emit.type !== 'template') return utility
    return {
        ...utility,
        emit: {
            ...utility.emit,
            declarations: normalizeTemplateDeclarations(utility.emit.declarations as Record<string, unknown>)
        }
    }
}

function stringifyPlan(plan: MasterCSSPlan) {
    return JSON.stringify(plan.utilities?.length
        ? { ...plan, utilities: plan.utilities.map(normalizeUtilityForJSON) }
        : plan)
}

export function toPlanModule(plan: MasterCSSPlan) {
    return `export default ${stringifyPlan(plan)};`
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
    return path.join(context, VIRTUAL_MODULE_DIR, VIRTUAL_PLAN_FILE)
}

function encodeVirtualFilename(id: string) {
    return Buffer.from(id).toString('base64url')
}

export function toVirtualCSSPlanModulePath(context: string, file: string) {
    return path.join(context, VIRTUAL_MODULE_DIR, `${encodeVirtualFilename(file)}.plan.js`)
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createVirtualDefaultPlanModulePathPattern() {
    const source = [...VIRTUAL_MODULE_DIR.split('/'), VIRTUAL_PLAN_FILE]
        .map(escapeRegExp)
        .join(String.raw`[/\\]`)
    return new RegExp(String.raw`(?:^|[/\\])${source}$`)
}
