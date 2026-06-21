import type { MasterCSSPlan } from 'shared/master-css-plan'
import { stringifyMasterCSSPlanJSON } from 'shared/master-css-plan-json'
import { PLAN_ASSET_FILE, PLAN_MODULE_FILE } from './plan-facade'

export type { MasterCSSPlan }

export const VIRTUAL_PLAN_ID = 'virtual:master-css-plan'
export const MASTER_CSS_PLAN_QUERY = '?master-css-plan'
export const VIRTUAL_PLAN_FILE = PLAN_MODULE_FILE
export const VIRTUAL_PLAN_ASSET_FILE = PLAN_ASSET_FILE
export const EMPTY_PLAN_JSON = '{"version":3}'

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

export type CSSPlanJSONResult = CSSPlanLoadResult & {
    json: string
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

export function toPlanJSON(plan: MasterCSSPlan) {
    return stringifyMasterCSSPlanJSON(plan)
}

export function toPlanJSONResult<T extends CSSPlanLoadResult>(result: T): T & { json: string } {
    return {
        ...result,
        json: toPlanJSON(result.plan)
    }
}
