import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  toBrowserManifestFacadeModule,
  toEmittedGlobalsModule,
  toUniversalManifestFacadeModule
} from '../src/module'

let generatedModuleIndex = 0

function importGeneratedModule(source: string) {
  const specifier = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#${generatedModuleIndex++}`
  return import(specifier) as Promise<{ default: unknown }>
}

const dataManifestURL = `data:application/json,${encodeURIComponent('{"version":1}')}`

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('@master/css-internal module helpers', () => {
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
    expect(source).toContain(`if (error?.name !== 'SyntaxError') throw error;`)
    expect(source).toContain('const response = await fetch(specifier)')
    expect(source).not.toContain('readFile')
  })

  it('prefers JSON import attributes without calling fetch', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    const module = await importGeneratedModule(
      toBrowserManifestFacadeModule(JSON.stringify(dataManifestURL))
    )

    expect(module.default).toEqual({ version: 1 })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('falls back to fetch only when import attributes fail to compile', async () => {
    const NativeFunction = globalThis.Function
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ version: 1 })
    }))
    vi.stubGlobal('Function', vi.fn(function MockFunction(...args: string[]) {
      if (args.at(-1)?.includes(`with: { type: 'json' }`)) throw new SyntaxError('Unsupported import attributes')
      return NativeFunction(...args)
    }))
    vi.stubGlobal('fetch', fetch)

    const module = await importGeneratedModule(
      toBrowserManifestFacadeModule(JSON.stringify(dataManifestURL))
    )

    expect(module.default).toEqual({ version: 1 })
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(dataManifestURL)
  })

  it('does not fetch when JSON import evaluation rejects', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const invalidJSONURL = `data:application/json,${encodeURIComponent('{invalid')}`

    await expect(importGeneratedModule(
      toBrowserManifestFacadeModule(JSON.stringify(invalidJSONURL))
    )).rejects.toBeInstanceOf(SyntaxError)

    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not fetch for non-syntax loader construction errors', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('Function', vi.fn(function MockFunction() {
      throw new EvalError('Blocked by policy')
    }))
    vi.stubGlobal('fetch', fetch)

    await expect(importGeneratedModule(
      toBrowserManifestFacadeModule(JSON.stringify(dataManifestURL))
    )).rejects.toThrow('Blocked by policy')

    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects unsuccessful fallback responses', async () => {
    vi.stubGlobal('Function', vi.fn(function MockFunction() {
      throw new SyntaxError('Unsupported import attributes')
    }))
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({})
    })))

    await expect(importGeneratedModule(
      toBrowserManifestFacadeModule(JSON.stringify(dataManifestURL))
    )).rejects.toThrow(`Cannot load the Master CSS manifest from ${dataManifestURL} (HTTP 503).`)
  })
})
