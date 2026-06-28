import { describe, expect, it } from 'vitest'
import ManifestPreloadPlugin from '../../src/plugins/manifest-preload'

describe('ManifestPreloadPlugin', () => {
    it('injects a preload link for the emitted default manifest asset', () => {
        const context = {
            defaultManifestAssetReferenceId: 'master_css_manifest_ref',
            defaultManifestAssetSource: '{"version":1}',
            config: {
                base: '/'
            }
        }
        const plugin = ManifestPreloadPlugin(context as never)
        const result = (plugin.transformIndexHtml as any).handler.call(
            {},
            '<html><head></head><body></body></html>',
            {
                path: '/index.html',
                bundle: {
                    'assets/master-css-manifest.CzuVhIZV.json': {
                        type: 'asset',
                        name: 'master-css-manifest.json',
                        fileName: 'assets/master-css-manifest.CzuVhIZV.json',
                        source: '{"version":1}'
                    }
                }
            }
        )

        expect(result.html).toBe('<html><head></head><body></body></html>')
        expect(result.tags).toEqual([
            {
                tag: 'link',
                attrs: {
                    rel: 'modulepreload',
                    as: 'json',
                    crossorigin: '',
                    href: '/assets/master-css-manifest.CzuVhIZV.json'
                },
                injectTo: 'head-prepend'
            }
        ])
    })

    it('does not inject in dev or before the default manifest asset is emitted', () => {
        const plugin = ManifestPreloadPlugin({ config: { base: '/' } } as never)
        const result = (plugin.transformIndexHtml as any).handler.call(
            {},
            '<html><head></head><body></body></html>',
            {
                path: '/index.html',
                bundle: {}
            }
        )

        expect(result).toBeUndefined()
    })

    it('does not inject without a build bundle context', () => {
        const plugin = ManifestPreloadPlugin({
            defaultManifestAssetReferenceId: 'master_css_manifest_ref',
            defaultManifestAssetSource: '{"version":1}',
            config: { base: '/' }
        } as never)
        const result = (plugin.transformIndexHtml as any).handler.call(
            {},
            '<html><head></head><body></body></html>',
            {
                path: '/index.html'
            }
        )

        expect(result).toBeUndefined()
    })

    it('does not inject a duplicate manifest preload link', () => {
        const context = {
            defaultManifestAssetReferenceId: 'master_css_manifest_ref',
            defaultManifestAssetSource: '{"version":1}',
            config: {
                base: '/'
            }
        }
        const plugin = ManifestPreloadPlugin(context as never)
        const html = '<html><head><link rel="modulepreload" as="json" href="/assets/master-css-manifest.CzuVhIZV.json"></head></html>'
        const result = (plugin.transformIndexHtml as any).handler.call(
            {},
            html,
            {
                path: '/index.html',
                bundle: {
                    'assets/master-css-manifest.CzuVhIZV.json': {
                        type: 'asset',
                        name: 'master-css-manifest.json',
                        fileName: 'assets/master-css-manifest.CzuVhIZV.json',
                        source: '{"version":1}'
                    }
                }
            }
        )

        expect(result).toBeUndefined()
    })
})
