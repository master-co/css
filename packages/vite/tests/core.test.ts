import { describe, expect, test } from 'vitest'
import masterCSS from '../src/core'
import type { PluginOptions } from '../src/options'

function pluginNames(mode?: PluginOptions['mode']) {
    return masterCSS({ mode }).map((plugin) => plugin.name)
}

describe('masterCSS plugin composition', () => {
    test.each(['runtime', 'pre-render', 'progressive', null] as const)('%s mode does not register extractor lifecycle plugins', (mode) => {
        const names = pluginNames(mode)

        expect(names).toContain('master-css:style-css')
        expect(names).not.toContain('master-css:extractor')
        expect(names).not.toContain('master-css:extract:css-import')
        expect(names).not.toContain('master-css:static')
        expect(names).not.toContain('master-css:static:css-import:hmr')
        expect(names).not.toContain('master-css:static:css-slot:build')
    })

    test('extract mode owns the extractor lifecycle plugins', () => {
        const names = pluginNames('extract')

        expect(names).not.toContain('master-css:style-css')
        expect(names).toEqual(expect.arrayContaining([
            'master-css:extractor',
            'master-css:extract:css-import',
            'master-css:static',
            'master-css:static:css-import:hmr',
            'master-css:static:css-slot:build'
        ]))
    })
})
