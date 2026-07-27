import { describe, expect, test } from 'vitest'
import masterCSS from '../src/core'
import type { MasterCSSVitePluginOptions } from '../src/options'

function pluginNames(options: MasterCSSVitePluginOptions = {}) {
  return masterCSS(options).map((plugin) => plugin.name)
}

describe('masterCSS plugin composition', () => {
  test.each(['runtime', 'static', 'pre-render', 'progressive'] as const)('%s mode registers the shared scanner and style entry pipeline', (mode) => {
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

  test('null mode registers the shared scanner and style entry pipeline', () => {
    const names = pluginNames({ mode: 'static' })

    expect(names.filter((name) => name === 'master-css:scanner')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:usage-graph')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry:hmr')).toHaveLength(1)
    expect(names.filter((name) => name === 'master-css:style-entry:build')).toHaveLength(1)
  })

  test('runtime mode registers runtime preloads only with runtime injection', () => {
    expect(pluginNames({ mode: 'runtime' })).toContain('master-css:manifest-preload')
    expect(pluginNames({ mode: 'runtime' })).toContain('master-css:runtime-preload')
    expect(pluginNames({ mode: 'runtime', runtime: false })).not.toContain('master-css:manifest-preload')
    expect(pluginNames({ mode: 'runtime', runtime: false })).not.toContain('master-css:runtime-preload')
    expect(pluginNames({ mode: 'progressive' })).not.toContain('master-css:manifest-preload')
    expect(pluginNames({ mode: 'progressive' })).not.toContain('master-css:runtime-preload')
    expect(pluginNames({ mode: 'static' })).not.toContain('master-css:manifest-preload')
    expect(pluginNames({ mode: 'static' })).not.toContain('master-css:runtime-preload')
    expect(pluginNames({ mode: 'pre-render' })).not.toContain('master-css:manifest-preload')
    expect(pluginNames({ mode: 'pre-render' })).not.toContain('master-css:runtime-preload')
  })

  test('enabled false disables the integration', () => {
    expect(pluginNames({ enabled: false })).toEqual([])
  })
})
