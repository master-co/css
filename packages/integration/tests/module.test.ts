import { describe, expect, it } from 'vitest'
import {
    CSS_RUNTIME_INJECTION,
    EMPTY_PLAN_JSON,
    EMPTY_PRELOADED_MODULE,
    MASTER_CSS_PLAN_QUERY,
    VIRTUAL_CSS_ID,
    VIRTUAL_PRELOADED_ID,
    VIRTUAL_PLAN_ID,
    normalizePreloaded,
    stripMasterCSSPlanQuery,
    stripResourceQuery,
    toPlanJSON,
    toPreloadedModule,
    toUniversalPlanFacadeModule
} from '../src/module'

describe('@master/css-integration module helpers', () => {
    it('defines Master CSS virtual module ids', () => {
        expect(VIRTUAL_PLAN_ID).toBe('virtual:master-css-plan')
        expect(VIRTUAL_CSS_ID).toBe('virtual:master-utilities.css')
        expect(VIRTUAL_PRELOADED_ID).toBe('virtual:master-css-preloaded')
        expect(MASTER_CSS_PLAN_QUERY).toBe('?master-css-plan')
    })

    it('serializes plan and preloaded modules', () => {
        expect(EMPTY_PLAN_JSON).toBe('{"version":3}')
        expect(EMPTY_PRELOADED_MODULE).toBe('export default { variables: {}, animations: {} };')
        expect(toPlanJSON({ version: 3 })).toBe('{"version":3}')
        expect(toPreloadedModule({ variables: { color: 1 } })).toBe('export default {"variables":{"color":1},"animations":{}};')
        expect(normalizePreloaded()).toEqual({ variables: {}, animations: {} })
    })

    it('matches and strips CSS plan resource queries', () => {
        expect(stripMasterCSSPlanQuery('./theme.css?master-css-plan')).toBe('./theme.css')
        expect(stripResourceQuery('./theme.css?master-css-plan')).toBe('./theme.css')
    })

    it('builds shared runtime injection source', () => {
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSPlan from '${VIRTUAL_PLAN_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSPreloaded from '${VIRTUAL_PRELOADED_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain('initCSSRuntime({ plan: masterCSSPlan, preloaded: masterCSSPreloaded });')
    })

    it('builds a universal plan facade that resolves Next production and dev assets', () => {
        const source = toUniversalPlanFacadeModule('new URL("./master-css-plan.json", import.meta.url)')

        expect(source).toContain(`join(process.cwd(), '.next', value.slice('/_next/'.length))`)
        expect(source).toContain(`join(process.cwd(), '.next/dev', value.slice('/_next/'.length))`)
        expect(source).toContain('for (const file of files)')
    })
})
