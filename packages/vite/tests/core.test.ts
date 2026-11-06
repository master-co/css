import { describe, expect, test } from 'vitest'
import masterCSS from '../src/core'
import type { MasterCSSVitePluginOptions } from '../src/options'

function pluginNames(options: MasterCSSVitePluginOptions = {}) {
  return masterCSS(options).map((plugin) => plugin.name)
}

describe('masterCSS plugin composition', () => {
  test.each(['runtime', "static", 'prerender', 'progressive'] as const)('%s mode registers the shared scanner and style entry pipeline', (mode) => {
    const names = pluginNames({ mode })

    expect(names.filter((name) => name === 'master-css:scanner')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:usage-graph')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry:hmr')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry:build')).toHaveLength(1)
    expect(names).toEqual(expect.arrayContaining([
      'master-css:scanner',
      'master-css:usage-graph',
      'master-css:style-entry',
      'master-css:style-entry:hmr',
      'master-css:style-entry:build'
    ]))
  })

  test('the deprecated pre-render mode resolves to prerender', () => {
    expect(pluginNames({ mode: 'pre-render' })).toEqual(pluginNames({ mode: 'prerender' }))
  })

  test('static mode registers the shared scanner and style entry pipeline', () => {
    const names = pluginNames({ mode: 'static' })

    expect(names.filter((name) => name === 'master-css:scanner')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:usage-graph')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry:hmr')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry:build')).toHaveLength(1)
  })

  test('runtime mode registers runtime preloads only with runtime injection', () => {
    expect(pluginNames({ mode: 'runtime' })).toContain('master-css:program-preload')
    expect(pluginNames({ mode: 'runtime' })).toContain('master-css:runtime-preload')
    expect(() => pluginNames({ mode: 'runtime', runtime: false })).toThrow(/runtime/)
    expect(() => pluginNames({ mode: 'static', runtime: true })).toThrow(/runtime/)
    expect(pluginNames({ mode: 'progressive' })).not.toContain('master-css:program-preload')
    expect(pluginNames({ mode: 'progressive' })).not.toContain('master-css:runtime-preload')
    expect(pluginNames({ mode: 'static' })).not.toContain('master-css:program-preload')
    expect(pluginNames({ mode: 'static' })).not.toContain('master-css:runtime-preload')
    expect(pluginNames({ mode: 'prerender' })).not.toContain('master-css:program-preload')
    expect(pluginNames({ mode: 'prerender' })).not.toContain('master-css:runtime-preload')
  })

  test('enabled false disables the integration', () => {
    expect(pluginNames({ enabled: false })).toEqual([])
  })

  test('rejects an unknown mode in JavaScript configs', () => {
    const options = JSON.parse('{"mode":"browser"}')
    expect(() => masterCSS(options)).toThrow('Invalid Master CSS rendering mode "browser". Supported modes: runtime, static, prerender, progressive.')
  })
})
