import { describe, expect, it } from 'vitest'
import InjectRuntimePlugin from '../../src/plugins/inject-runtime'

describe('InjectRuntimePlugin', () => {
    it('injects the runtime through Vite HTML transform tags', () => {
        const plugin = InjectRuntimePlugin({})
        const result = (plugin.transformIndexHtml as any)('<html><head></head><body></body></html>')

        expect(result.html).toBe('<html><head></head><body></body></html>')
        expect(result.tags).toHaveLength(1)
        expect(result.tags[0]).toMatchObject({
            tag: 'script',
            attrs: {
                type: 'module'
            },
            injectTo: 'head-prepend'
        })
        expect(result.tags[0].children).toContain('/*__MASTER_CSS_RUNTIME_INJECTED__*/')
        expect(result.tags[0].children).toContain(`import masterCSSConfig from 'virtual:master-css-config';`)
        expect(result.tags[0].children).toContain(`import masterCSSPreloaded from 'virtual:master-css-preloaded';`)
        expect(result.tags[0].children).toContain('initCSSRuntime({ config: masterCSSConfig, preloaded: masterCSSPreloaded });')
    })

    it('does not inject twice when the marker is already present', () => {
        const plugin = InjectRuntimePlugin({})
        const result = (plugin.transformIndexHtml as any)('/*__MASTER_CSS_RUNTIME_INJECTED__*/')

        expect(result).toBeUndefined()
    })
})
