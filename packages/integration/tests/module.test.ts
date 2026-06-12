import { describe, expect, it } from 'vitest'
import path from 'node:path'
import {
    CSS_RUNTIME_INJECTION,
    EMPTY_CONFIG_MODULE,
    EMPTY_PRELOADED_MODULE,
    MASTER_CSS_CONFIG_QUERY,
    VIRTUAL_CONFIG_ID,
    VIRTUAL_CSS_ID,
    VIRTUAL_PRELOADED_ID,
    VIRTUAL_PLAN_ID,
    createVirtualDefaultConfigModulePathPattern,
    fromResolvedMasterCSSConfigId,
    normalizePreloaded,
    stripMasterCSSConfigQuery,
    stripResourceQuery,
    toConfigModule,
    toPreloadedModule,
    toResolvedMasterCSSConfigId,
    toVirtualCSSConfigModulePath,
    toVirtualCSSModulePath,
    toVirtualDefaultConfigModulePath,
    toVirtualPreloadedModulePath
} from '../src/module'

describe('@master/css-integration module helpers', () => {
    it('defines Master CSS virtual module ids', () => {
        expect(VIRTUAL_CONFIG_ID).toBe('virtual:master-css-config')
        expect(VIRTUAL_CSS_ID).toBe('virtual:master-utilities.css')
        expect(VIRTUAL_PRELOADED_ID).toBe('virtual:master-css-preloaded')
        expect(MASTER_CSS_CONFIG_QUERY).toBe('?master-css-config')
    })

    it('serializes config and preloaded modules', () => {
        expect(EMPTY_CONFIG_MODULE).toBe('export default {};')
        expect(EMPTY_PRELOADED_MODULE).toBe('export default { variables: {}, animations: {} };')
        expect(toConfigModule({ config: true })).toBe('export default {"config":true};')
        expect(toPreloadedModule({ variables: { color: 1 } })).toBe('export default {"variables":{"color":1},"animations":{}};')
        expect(normalizePreloaded()).toEqual({ variables: {}, animations: {} })
    })

    it('encodes resolved and filesystem virtual module paths', () => {
        const root = path.resolve('/project')
        const file = path.join(root, 'src/theme.css')
        const id = toResolvedMasterCSSConfigId(file)

        expect(fromResolvedMasterCSSConfigId(id)).toBe(file)
        expect(stripMasterCSSConfigQuery('./theme.css?master-css-config')).toBe('./theme.css')
        expect(stripResourceQuery('./theme.css?master-css-config')).toBe('./theme.css')
        expect(toVirtualDefaultConfigModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-config.js'))
        expect(toVirtualCSSConfigModulePath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.js$/)
        expect(toVirtualCSSModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-utilities.css'))
        expect(toVirtualPreloadedModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-preloaded.js'))
        expect(createVirtualDefaultConfigModulePathPattern().test(toVirtualDefaultConfigModulePath(root))).toBe(true)
    })

    it('builds shared runtime injection source', () => {
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSPlan from '${VIRTUAL_PLAN_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSPreloaded from '${VIRTUAL_PRELOADED_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain('initCSSRuntime({ plan: masterCSSPlan, preloaded: masterCSSPreloaded });')
    })
})
