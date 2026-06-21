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
        expect(result.tags[0].children).toContain(`import masterCSSManifest from 'virtual:master-css-manifest';`)
        expect(result.tags[0].children).toContain(`import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals';`)
        expect(result.tags[0].children).toContain('initCSSRuntime({ manifest: masterCSSManifest, emittedGlobals: masterCSSEmittedGlobals });')
    })

    it('does not inject twice when the marker is already present', () => {
        const plugin = InjectRuntimePlugin({})
        const result = (plugin.transformIndexHtml as any)('/*__MASTER_CSS_RUNTIME_INJECTED__*/')

        expect(result).toBeUndefined()
    })
})
