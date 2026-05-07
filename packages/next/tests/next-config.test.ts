import { describe, expect, it } from 'vitest'
import withMasterCSS from '../src'
import { getRegisteredOptions } from '../src/options'

describe('withMasterCSS', () => {
    it('sets the Next adapter path and registers options', () => {
        const nextConfig = withMasterCSS({ reactStrictMode: true }, { manifest: 'master-css.json' })

        expect(nextConfig.reactStrictMode).toBe(true)
        expect(nextConfig.adapterPath).toContain('adapter.mjs')
        expect(getRegisteredOptions()).toEqual({ manifest: 'master-css.json' })
    })

    it('adds a CSS config webpack loader', () => {
        const nextConfig = withMasterCSS({}) as any
        const webpackConfig = { module: { rules: [] } }
        const resolvedConfig = nextConfig.webpack(webpackConfig as any, {} as any)

        expect(resolvedConfig.module.rules).toEqual([
            expect.objectContaining({
                resourceQuery: /master-css-config/,
                type: 'javascript/auto'
            })
        ])
    })

    it('adds a CSS config Turbopack loader', () => {
        const nextConfig = withMasterCSS({
            turbopack: {
                rules: {
                    '*.svg': {
                        type: 'asset'
                    }
                }
            }
        })

        expect(nextConfig.turbopack.rules).toEqual({
            '*': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.css$/ },
                            { query: /master-css-config/ }
                        ]
                    },
                    type: 'ecmascript',
                    as: '*.js'
                })
            ],
            '*.svg': {
                type: 'asset'
            }
        })
    })

    it('adds CSS config loaders without the adapter when mode is null', () => {
        const nextConfig = { reactStrictMode: true }
        const resolvedConfig = withMasterCSS(nextConfig, { mode: null }) as any

        expect(resolvedConfig.reactStrictMode).toBe(true)
        expect(resolvedConfig.adapterPath).toBeUndefined()
        expect(resolvedConfig.turbopack.rules).toEqual({
            '*': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.css$/ },
                            { query: /master-css-config/ }
                        ]
                    },
                    type: 'ecmascript',
                    as: '*.js'
                })
            ]
        })
        expect(resolvedConfig.webpack({ module: { rules: [] } }, {}).module.rules).toEqual([
            expect.objectContaining({
                resourceQuery: /master-css-config/
            })
        ])
    })
})
