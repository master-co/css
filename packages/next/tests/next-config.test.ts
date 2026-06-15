import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import withMasterCSS from '../src'
import { getRegisteredOptions } from '../src/options'
import { VIRTUAL_PLAN_ID } from '@master/css-integration/plan-module'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { VIRTUAL_PRELOADED_ID } from '@master/css-integration/preloaded-module'

const toPosixPath = (value: string) => value.replace(/\\/g, '/')
const virtualPlanProjectPath = 'node_modules/.master-css/master-css-plan.js'
const virtualPreloadedProjectPath = 'node_modules/.master-css/master-css-preloaded.js'
const composedAdapterProjectPath = 'node_modules/.master-css/master-css-next-adapter.mjs'

describe('withMasterCSS', () => {
    it('sets the Next adapter path and registers options', () => {
        const nextConfig = withMasterCSS({ reactStrictMode: true }, { manifest: 'master-css.json' })

        expect(nextConfig.reactStrictMode).toBe(true)
        expect(nextConfig.adapterPath).toContain('adapter.mjs')
        expect(getRegisteredOptions()).toEqual({ manifest: 'master-css.json' })
    })

    it('adds a CSS plan webpack loader', () => {
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
                resourceQuery: /master-css-plan/,
                type: 'javascript/auto'
            }),
            expect.objectContaining({
                test: /\.(css|scss|sass)$/,
                resourceQuery: {
                    not: [/master-css-plan/]
                }
            })
        ]))
        expect(resolvedConfig.resolve.alias[VIRTUAL_PLAN_ID]).toContain(join('node_modules', '.master-css', 'master-css-plan.js'))
        expect(resolvedConfig.resolve.alias[VIRTUAL_PRELOADED_ID]).toContain(join('node_modules', '.master-css', 'master-css-preloaded.js'))
        expect(resolvedConfig.resolve.alias['@master/css.react']).toBeUndefined()
        expect(resolvedConfig.resolve.alias['@master/css.react$']).toBeUndefined()
    })

    it('adds a CSS plan Turbopack loader', () => {
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
                            { query: /master-css-plan/ }
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
                            { not: { query: /master-css-plan/ } }
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
                            { content: expect.any(RegExp) }
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
                            { content: expect.any(RegExp) }
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
                            { content: expect.any(RegExp) }
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
                            { content: expect.any(RegExp) }
                        ]
                    },
                    type: 'typescript'
                })
            ],
            '*.svg': {
                type: 'asset'
            }
        })
        expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_PLAN_ID]).toContain(virtualPlanProjectPath)
        expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_PRELOADED_ID]).toContain(virtualPreloadedProjectPath)
        expect((nextConfig as any).turbopack.resolveAlias['@master/css.react']).toBeUndefined()
        expect((nextConfig as any).transpilePackages).toContain('@master/css.react')
    })

    it('adds CSS plan loaders without the adapter when mode is null', () => {
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
                            { query: /master-css-plan/ }
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
                            { not: { query: /master-css-plan/ } }
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
                            { content: expect.any(RegExp) }
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
                            { content: expect.any(RegExp) }
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
                            { content: expect.any(RegExp) }
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
                            { content: expect.any(RegExp) }
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
                resourceQuery: /master-css-plan/
            }),
            expect.objectContaining({
                test: /\.(css|scss|sass)$/
            })
        ]))
    })

    it('composes an existing Next adapter path with the Master CSS adapter', () => {
        const cwd = process.cwd()
        const root = mkdtempSync(join(tmpdir(), 'master-css-next-composed-config-'))
        try {
            process.chdir(root)
            const nextConfig = withMasterCSS({
                adapterPath: './external-adapter.mjs'
            }, {
                adapterOrder: 'external-first'
            }) as any
            const adapterSource = readFileSync(nextConfig.adapterPath, 'utf-8')

            expect(toPosixPath(nextConfig.adapterPath)).toContain(composedAdapterProjectPath)
            expect(adapterSource).toContain('createComposedAdapter(createAdapter(), loadExternalAdapter')
            expect(adapterSource).toContain('const externalAdapterPath = "./external-adapter.mjs"')
            expect(adapterSource).toContain('const adapterOrder = "external-first"')
        } finally {
            process.chdir(cwd)
        }
    })

    it('composes NEXT_ADAPTER_PATH when no adapter path is configured', () => {
        const cwd = process.cwd()
        const root = mkdtempSync(join(tmpdir(), 'master-css-next-env-adapter-'))
        const originalAdapterPath = process.env.NEXT_ADAPTER_PATH
        try {
            process.chdir(root)
            process.env.NEXT_ADAPTER_PATH = './env-adapter.mjs'
            const nextConfig = withMasterCSS({}) as any
            const adapterSource = readFileSync(nextConfig.adapterPath, 'utf-8')

            expect(toPosixPath(nextConfig.adapterPath)).toContain(composedAdapterProjectPath)
            expect(adapterSource).toContain('const externalAdapterPath = "./env-adapter.mjs"')
            expect(adapterSource).toContain('const adapterOrder = "master-first"')
        } finally {
            if (originalAdapterPath === undefined) {
                delete process.env.NEXT_ADAPTER_PATH
            } else {
                process.env.NEXT_ADAPTER_PATH = originalAdapterPath
            }
            process.chdir(cwd)
        }
    })

    it('sets up static mode with Turbopack rules without adding a webpack callback', async () => {
        const cwd = process.cwd()
        const root = mkdtempSync(join(tmpdir(), 'master-css-next-config-'))
        mkdirSync(join(root, 'app'), { recursive: true })
        writeFileSync(join(root, 'index.css'), '@master;')
        writeFileSync(join(root, 'app/page.tsx'), 'export default function Page() { return <main className="block" /> }')
        try {
            process.chdir(root)
            const nextConfig = await withMasterCSS({}, {
                mode: 'static'
            }) as any

            expect(nextConfig.webpack).toBeUndefined()
            expect(nextConfig.turbopack.resolveAlias[VIRTUAL_CSS_ID]).toBe('./.master/next.css')
            expect(nextConfig.turbopack.resolveAlias[VIRTUAL_PLAN_ID]).toContain(virtualPlanProjectPath)
            expect(nextConfig.turbopack.resolveAlias[VIRTUAL_PRELOADED_ID]).toContain(virtualPreloadedProjectPath)
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
                                statePath: expect.stringContaining('next-static-state.json')
                            })
                        })
                    ]
                }),
                expect.objectContaining({
                    condition: {
                        all: [
                            { path: /\.css$/ },
                            { query: /master-css-plan/ }
                        ]
                    }
                }),
                expect.objectContaining({
                    condition: expect.objectContaining({
                        all: expect.arrayContaining([
                            { path: expect.any(RegExp) },
                            { content: expect.any(RegExp) },
                            { not: { query: /master-css-plan/ } }
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
