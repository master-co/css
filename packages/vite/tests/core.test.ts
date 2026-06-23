import { describe, expect, test } from 'vitest'
import masterCSS from '../src/core'
import type { PluginOptions } from '../src/options'

function pluginNames(options: PluginOptions = {}) {
    return masterCSS(options).map((plugin) => plugin.name)
}

describe('masterCSS plugin composition', () => {
    test.each(['runtime', 'static', 'pre-render', 'progressive', null] as const)('%s mode registers the shared scanner and style entry pipeline', (mode) => {
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

    test('runtime mode registers manifest preload only with runtime injection', () => {
        expect(pluginNames({ mode: 'runtime' })).toContain('master-css:manifest-preload')
        expect(pluginNames({ mode: 'runtime', injectRuntime: false })).not.toContain('master-css:manifest-preload')
        expect(pluginNames({ mode: 'progressive' })).not.toContain('master-css:manifest-preload')
        expect(pluginNames({ mode: 'static' })).not.toContain('master-css:manifest-preload')
        expect(pluginNames({ mode: 'pre-render' })).not.toContain('master-css:manifest-preload')
        expect(pluginNames({ mode: null })).not.toContain('master-css:manifest-preload')
    })
})
