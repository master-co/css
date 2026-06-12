import type { CSSPlanLoadResult } from '@master/css-integration/plan-module'
import type { MasterCSSPlan } from 'shared/master-css-plan'

export interface LoadPlanOptions {
    basePlan?: MasterCSSPlan
    classes?: string[]
    onWarning?: (warning: string) => void
}

export type LoadPlanResult = CSSPlanLoadResult

export interface LoadProjectPlanOptions extends LoadPlanOptions {
    entries?: string[]
}

export type LoadProjectPlanResult = LoadPlanResult & {
    entries: string[]
}
