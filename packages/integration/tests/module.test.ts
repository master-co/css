import { describe, expect, it } from 'vitest'
import path from 'node:path'
import {
    CSS_RUNTIME_INJECTION,
    EMPTY_PLAN_JSON,
    EMPTY_PRELOADED_MODULE,
    MASTER_CSS_PLAN_QUERY,
    VIRTUAL_CSS_ID,
    VIRTUAL_PRELOADED_ID,
    VIRTUAL_PLAN_ID,
    createVirtualDefaultPlanModulePathPattern,
    fromResolvedMasterCSSPlanId,
    normalizePreloaded,
    stripMasterCSSPlanQuery,
    stripResourceQuery,
    toPlanJSON,
    toPreloadedModule,
    toResolvedMasterCSSPlanId,
    toVirtualCSSPlanModulePath,
    toVirtualCSSModulePath,
    toVirtualDefaultPlanModulePath,
    toVirtualPreloadedModulePath
} from '../src/module'

describe('@master/css-integration module helpers', () => {
    it('defines Master CSS virtual module ids', () => {
        expect(VIRTUAL_PLAN_ID).toBe('virtual:master-css-plan')
        expect(VIRTUAL_CSS_ID).toBe('virtual:master-utilities.css')
        expect(VIRTUAL_PRELOADED_ID).toBe('virtual:master-css-preloaded')
        expect(MASTER_CSS_PLAN_QUERY).toBe('?master-css-plan')
    })

    it('serializes plan and preloaded modules', () => {
        expect(EMPTY_PLAN_JSON).toBe('{"version":1}')
        expect(EMPTY_PRELOADED_MODULE).toBe('export default { variables: {}, animations: {} };')
        expect(toPlanJSON({ version: 1 })).toBe('{"version":1}')
        expect(toPreloadedModule({ variables: { color: 1 } })).toBe('export default {"variables":{"color":1},"animations":{}};')
        expect(normalizePreloaded()).toEqual({ variables: {}, animations: {} })
    })

    it('encodes resolved and filesystem virtual module paths', () => {
        const root = path.resolve('/project')
        const file = path.join(root, 'src/theme.css')
        const id = toResolvedMasterCSSPlanId(file)

        expect(fromResolvedMasterCSSPlanId(id)).toBe(file)
        expect(stripMasterCSSPlanQuery('./theme.css?master-css-plan')).toBe('./theme.css')
        expect(stripResourceQuery('./theme.css?master-css-plan')).toBe('./theme.css')
        expect(toVirtualDefaultPlanModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-plan.js'))
        expect(toVirtualCSSPlanModulePath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.plan\.js$/)
        expect(toVirtualCSSModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-utilities.css'))
        expect(toVirtualPreloadedModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-preloaded.js'))
        expect(createVirtualDefaultPlanModulePathPattern().test(toVirtualDefaultPlanModulePath(root))).toBe(true)
    })

    it('builds shared runtime injection source', () => {
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSPlan from '${VIRTUAL_PLAN_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSPreloaded from '${VIRTUAL_PRELOADED_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain('initCSSRuntime({ plan: masterCSSPlan, preloaded: masterCSSPreloaded });')
    })
})
