import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import withMasterCSS from '../src'
import { getRegisteredOptions } from '../src/options'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'
import { VIRTUAL_CONFIG_ID } from '@master/css-configer/module'

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

        expect(resolvedConfig.module.rules).toEqual(expect.arrayContaining([
            expect.objectContaining({
                test: expect.any(RegExp),
                type: 'javascript/auto',
                use: [
                    expect.objectContaining({
                        options: {
                            virtual: true
                        }
                    })
                ]
            }),
            expect.objectContaining({
                resourceQuery: /master-css-config/,
                type: 'javascript/auto'
            }),
            expect.objectContaining({
                test: /\.(css|scss|sass)$/,
                resourceQuery: {
                    not: [/master-css-config/]
                }
            })
        ]))
        expect(resolvedConfig.resolve.alias[VIRTUAL_CONFIG_ID]).toContain(join('node_modules', '.master-css', 'master-css-config.js'))
        expect(resolvedConfig.resolve.alias['@master/css.react']).toBeUndefined()
        expect(resolvedConfig.resolve.alias['@master/css.react$']).toBeUndefined()
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
            '*': expect.arrayContaining([
                expect.objectContaining({
                    condition: {
                        path: expect.any(RegExp)
                    },
                    loaders: [
                        expect.objectContaining({
                            options: {
                                virtual: true
                            }
                        })
                    ],
                    type: 'ecmascript',
                    as: '*.js'
                }),
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.css$/ },
                            { query: /master-css-config/ }
                        ]
                    },
                    type: 'ecmascript',
                    as: '*.js'
                }),
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.(css|scss|sass)$/ },
                            { content: expect.any(RegExp) },
                            { not: { query: /master-css-config/ } }
                        ]
                    },
                    type: 'css',
                    as: '*.css'
                })
            ]),
            '*.js': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'ecmascript'
                })
            ],
            '*.mjs': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'ecmascript'
                })
            ],
            '*.cjs': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'ecmascript'
                })
            ],
            '*.ts': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'typescript'
                })
            ],
            '*.svg': {
                type: 'asset'
            }
        })
        expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_CONFIG_ID]).toContain(join('node_modules', '.master-css', 'master-css-config.js'))
        expect((nextConfig as any).turbopack.resolveAlias['@master/css.react']).toBeUndefined()
        expect((nextConfig as any).transpilePackages).toContain('@master/css.react')
    })

    it('adds CSS config loaders without the adapter when mode is null', () => {
        const nextConfig = { reactStrictMode: true }
        const resolvedConfig = withMasterCSS(nextConfig, { mode: null }) as any

        expect(resolvedConfig.reactStrictMode).toBe(true)
        expect(resolvedConfig.adapterPath).toBeUndefined()
        expect(resolvedConfig.turbopack.rules).toEqual({
            '*': expect.arrayContaining([
                expect.objectContaining({
                    condition: {
                        path: expect.any(RegExp)
                    },
                    type: 'ecmascript',
                    as: '*.js'
                }),
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.css$/ },
                            { query: /master-css-config/ }
                        ]
                    },
                    type: 'ecmascript',
                    as: '*.js'
                }),
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.(css|scss|sass)$/ },
                            { content: expect.any(RegExp) },
                            { not: { query: /master-css-config/ } }
                        ]
                    },
                    type: 'css',
                    as: '*.css'
                })
            ]),
            '*.js': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'ecmascript'
                })
            ],
            '*.mjs': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'ecmascript'
                })
            ],
            '*.cjs': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'ecmascript'
                })
            ],
            '*.ts': [
                expect.objectContaining({
                    condition: {
                        all: [
                            { not: 'foreign' },
                            { content: /\?master-css-config/ }
                        ]
                    },
                    type: 'typescript'
                })
            ]
        })
        expect(resolvedConfig.webpack({ module: { rules: [] } }, {}).module.rules).toEqual(expect.arrayContaining([
            expect.objectContaining({
                test: expect.any(RegExp),
                type: 'javascript/auto'
            }),
            expect.objectContaining({
                resourceQuery: /master-css-config/
            }),
            expect.objectContaining({
                test: /\.(css|scss|sass)$/
            })
        ]))
    })

    it('sets up extract mode with Turbopack rules without adding a webpack callback', async () => {
        const cwd = process.cwd()
        const root = mkdtempSync(join(tmpdir(), 'master-css-next-config-'))
        mkdirSync(join(root, 'app'), { recursive: true })
        writeFileSync(join(root, 'index.css'), '@master;')
        writeFileSync(join(root, 'app/page.tsx'), 'export default function Page() { return <main className="block" /> }')
        try {
            process.chdir(root)
            const nextConfig = await withMasterCSS({}, {
                mode: 'extract'
            }) as any

            expect(nextConfig.webpack).toBeUndefined()
            expect(nextConfig.turbopack.resolveAlias[VIRTUAL_CSS_ID]).toBe('./.master/next.css')
            expect(nextConfig.turbopack.resolveAlias[VIRTUAL_CONFIG_ID]).toContain(join('node_modules', '.master-css', 'master-css-config.js'))
            expect(nextConfig.turbopack.rules['*']).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    condition: {
                        path: expect.any(RegExp)
                    },
                    type: 'ecmascript',
                    as: '*.js'
                }),
                expect.objectContaining({
                    loaders: [
                        expect.objectContaining({
                            options: expect.objectContaining({
                                statePath: expect.stringContaining('next-extract-state.json')
                            })
                        })
                    ]
                }),
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.css$/ },
                            { query: /master-css-config/ }
                        ]
                    }
                }),
                expect.objectContaining({
                    condition: expect.objectContaining({
                        all: expect.arrayContaining([
                            { path: expect.any(RegExp) },
                            { content: expect.any(RegExp) },
                            { not: { query: /master-css-config/ } }
                        ])
                    }),
                    type: 'css',
                    as: '*.css'
                })
            ]))
        } finally {
            process.chdir(cwd)
        }
    })
})
