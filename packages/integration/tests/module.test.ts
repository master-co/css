import { describe, expect, it } from 'vitest'
import {
    CSS_RUNTIME_INJECTION,
    EMPTY_MANIFEST_JSON,
    EMPTY_EMITTED_GLOBALS_MODULE,
    MASTER_CSS_MANIFEST_QUERY,
    VIRTUAL_CSS_ID,
    VIRTUAL_EMITTED_GLOBALS_ID,
    VIRTUAL_MANIFEST_ID,
    normalizeEmittedGlobals,
    stripMasterCSSManifestQuery,
    stripResourceQuery,
    toManifestJSON,
    toEmittedGlobalsModule,
    toUniversalManifestFacadeModule
} from '../src/module'

describe('@master/css-integration module helpers', () => {
    it('defines Master CSS virtual module ids', () => {
        expect(VIRTUAL_MANIFEST_ID).toBe('virtual:master-css-manifest')
        expect(VIRTUAL_CSS_ID).toBe('virtual:master-utilities.css')
        expect(VIRTUAL_EMITTED_GLOBALS_ID).toBe('virtual:master-css-emitted-globals')
        expect(MASTER_CSS_MANIFEST_QUERY).toBe('?master-css-manifest')
    })

    it('serializes manifest and emittedGlobals modules', () => {
        expect(EMPTY_MANIFEST_JSON).toBe('{"version":1}')
        expect(EMPTY_EMITTED_GLOBALS_MODULE).toBe('export default { variables: {}, animations: {} };')
        expect(toManifestJSON({ version: 1 })).toBe('{"version":1}')
        expect(toEmittedGlobalsModule({ variables: { color: 1 } })).toBe('export default {"variables":{"color":1},"animations":{}};')
        expect(normalizeEmittedGlobals()).toEqual({ variables: {}, animations: {} })
    })

    it('matches and strips CSS manifest resource queries', () => {
        expect(stripMasterCSSManifestQuery('./theme.css?master-css-manifest')).toBe('./theme.css')
        expect(stripResourceQuery('./theme.css?master-css-manifest')).toBe('./theme.css')
    })

    it('builds shared runtime injection source', () => {
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSManifest from '${VIRTUAL_MANIFEST_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain(`import masterCSSEmittedGlobals from '${VIRTUAL_EMITTED_GLOBALS_ID}';`)
        expect(CSS_RUNTIME_INJECTION).toContain('initCSSRuntime({ manifest: masterCSSManifest, emittedGlobals: masterCSSEmittedGlobals });')
    })

    it('builds a universal manifest facade that resolves Next production and dev assets', () => {
        const source = toUniversalManifestFacadeModule('new URL("./master-css-manifest.json", import.meta.url)')

        expect(source).toContain(`join(process.cwd(), '.next', value.slice('/_next/'.length))`)
        expect(source).toContain(`join(process.cwd(), '.next/dev', value.slice('/_next/'.length))`)
        expect(source).toContain('for (const file of files)')
    })
})
