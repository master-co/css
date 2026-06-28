import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as moduleHelpers from '../src/module'
import {
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
    toManifestPreloadLinkAttrs,
    toManifestPreloadLinkTag,
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

    it('does not expose runtime injection source helpers', () => {
        const packageJSON = JSON.parse(
            readFileSync(resolve(__dirname, '../package.json'), 'utf8')
        ) as { exports: Record<string, unknown> }

        expect(moduleHelpers).not.toHaveProperty('CSS_RUNTIME_INJECTION')
        expect(moduleHelpers).not.toHaveProperty('MASTER_CSS_RUNTIME_INJECTED_MARKER')
        expect(moduleHelpers).not.toHaveProperty('VIRTUAL_RUNTIME_ID')
        expect(packageJSON.exports).not.toHaveProperty('./runtime')
    })

    it('matches and strips CSS manifest resource queries', () => {
        expect(stripMasterCSSManifestQuery('./theme.css?master-css-manifest')).toBe('./theme.css')
        expect(stripResourceQuery('./theme.css?master-css-manifest')).toBe('./theme.css')
    })

    it('builds manifest JSON preload link attributes and HTML', () => {
        expect(toManifestPreloadLinkAttrs('/assets/master-css-manifest.json')).toEqual({
            rel: 'modulepreload',
            as: 'json',
            crossorigin: '',
            href: '/assets/master-css-manifest.json'
        })
        expect(toManifestPreloadLinkTag('/assets/master-css-manifest.json?x=1&name="main"')).toBe(
            '<link rel="modulepreload" as="json" crossorigin href="/assets/master-css-manifest.json?x=1&amp;name=&quot;main&quot;">'
        )
    })

    it('builds a universal manifest facade that resolves Next production and dev assets', () => {
        const source = toUniversalManifestFacadeModule('new URL("./master-css-manifest.json", import.meta.url)')

        expect(source).toContain(`join(process.cwd(), '.next', value.slice('/_next/'.length))`)
        expect(source).toContain(`join(process.cwd(), '.next', 'dev', value.slice('/_next/'.length))`)
        expect(source).toContain('for (const file of files)')
        expect(source).toContain(`return import(specifier, options)`)
        expect(source).toContain(`with: { type: 'json' }`)
        expect(source).not.toContain('fetch(')
        expect(source).not.toContain('readFile')
    })
})
