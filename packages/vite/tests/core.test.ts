import { describe, expect, test } from 'vitest'
import masterCSS from '../src/core'
import type { PluginOptions } from '../src/options'

function pluginNames(mode?: PluginOptions['mode']) {
    return masterCSS({ mode }).map((plugin) => plugin.name)
}

describe('masterCSS plugin composition', () => {
    test.each(['runtime', 'extract', 'pre-render', 'progressive', null] as const)('%s mode registers the shared extractor and style entry pipeline', (mode) => {
        const names = pluginNames(mode)

        expect(names.filter((name) => name === 'master-css:extractor')).toHaveLength(1)
        expect(names.filter((name) => name === 'master-css:usage-graph')).toHaveLength(1)
        expect(names.filter((name) => name === 'master-css:style-entry')).toHaveLength(1)
        expect(names.filter((name) => name === 'master-css:style-entry:hmr')).toHaveLength(1)
        expect(names.filter((name) => name === 'master-css:style-entry:build')).toHaveLength(1)
        expect(names).toEqual(expect.arrayContaining([
            'master-css:extractor',
            'master-css:usage-graph',
            'master-css:style-entry',
            'master-css:style-entry:hmr',
            'master-css:style-entry:build'
        ]))
    })
})
