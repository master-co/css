import { describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import withMasterCSS from '../src'
import { getRegisteredOptions } from '../src/options'
import { VIRTUAL_MANIFEST_ID } from '@master/css-integration/manifest-module'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-integration/emitted-globals-module'

const toPosixPath = (value: string) => value.replace(/\\/g, '/')
const virtualManifestProjectPath = 'node_modules/.master-css/master-css-manifest.js'
const virtualEmittedGlobalsProjectPath = 'node_modules/.master-css/master-css-emitted-globals.js'
const composedAdapterProjectPath = 'node_modules/.master-css/master-css-next-adapter.js'
const instrumentationClientProjectPath = 'node_modules/.master-css/master-css-next-instrumentation-client.js'
const nextInstrumentationClientId = 'private-next-instrumentation-client'
const masterCSSUserInstrumentationClientId = 'private-next-master-css-user-instrumentation-client'
const removedReactPackageName = ['@master', 'css.react'].join('/')

function readGeneratedInstrumentationClientSource(root: string) {
  const cwd = process.cwd()
  try {
    process.chdir(root)
    withMasterCSS({})
    return readFileSync(join(root, 'node_modules', '.master-css', 'master-css-next-instrumentation-client.js'), 'utf-8')
  } finally {
    process.chdir(cwd)
  }
}

const AsyncFunction = async function () { }.constructor as new (...args: string[]) => (...args: unknown[]) => Promise<void>

function toRunnableInstrumentationClientSource(source: string) {
  return source
    .replace(`import 'private-next-master-css-user-instrumentation-client'`, `await importModule('private-next-master-css-user-instrumentation-client')`)
    .replace(`import CSSRuntime from '@master/css-runtime'`, `const CSSRuntime = await importDefault('@master/css-runtime')`)
    .replace(`import masterCSSManifest from 'virtual:master-css-manifest'`, `const masterCSSManifest = await importDefault('virtual:master-css-manifest')`)
    .replace(`import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'`, `const masterCSSEmittedGlobals = await importDefault('virtual:master-css-emitted-globals')`)
    .replaceAll(`import('virtual:master-css-manifest')`, `importModule('virtual:master-css-manifest')`)
    .replaceAll(`import('virtual:master-css-emitted-globals')`, `importModule('virtual:master-css-emitted-globals')`)
    .replaceAll('import.meta.turbopackHot', 'importMeta.turbopackHot')
    .replaceAll('import.meta.webpackHot', 'importMeta.webpackHot')
}

async function runInstrumentationClient(source: string, modules: Record<string, unknown>) {
  const runtimeGlobal = globalThis as unknown as {
    document?: unknown
    __MASTER_CSS_NEXT_RUNTIME__?: unknown
  }
  const previousDocument = runtimeGlobal.document
  const previousRuntimeState = runtimeGlobal.__MASTER_CSS_NEXT_RUNTIME__
  const importModule = vi.fn(async (id: string) => {
    if (Object.prototype.hasOwnProperty.call(modules, id)) return modules[id]
    throw new Error(`Unexpected import: ${id}`)
  })
  const importDefault = async (id: string) => {
    const module = await importModule(id)
    return module && typeof module === 'object' && 'default' in module
      ? module.default
      : module
  }
  const importMeta = { turbopackHot: undefined, webpackHot: undefined }

  runtimeGlobal.document = {}
  delete runtimeGlobal.__MASTER_CSS_NEXT_RUNTIME__

  try {
    const run = new AsyncFunction('importModule', 'importDefault', 'importMeta', toRunnableInstrumentationClientSource(source))
    await run(importModule, importDefault, importMeta)
    await new Promise((resolve) => setTimeout(resolve, 0))
  } finally {
    if (previousDocument === undefined) {
      delete runtimeGlobal.document
    } else {
      runtimeGlobal.document = previousDocument
    }
    if (previousRuntimeState === undefined) {
      delete runtimeGlobal.__MASTER_CSS_NEXT_RUNTIME__
    } else {
      runtimeGlobal.__MASTER_CSS_NEXT_RUNTIME__ = previousRuntimeState
    }
  }

  return { importModule }
}

function createCSSRuntimeTestModule() {
  const runtime = {
    destroy: vi.fn(),
    needsHydrationManifest: vi.fn(() => false),
    loadHydrationManifest: vi.fn(),
    observe: vi.fn()
  }
  runtime.observe.mockReturnValue(runtime)

  return {
    runtime,
    module: {
      default: {
        create: vi.fn(() => runtime)
      }
    }
  }
}

describe('withMasterCSS', () => {
  it('sets the Next adapter path and registers options', () => {
    const nextConfig = withMasterCSS({ reactStrictMode: true }, { buildReport: 'master-css.json' })

    expect(nextConfig.reactStrictMode).toBe(true)
    expect(nextConfig.adapterPath).toContain('adapter.js')
    expect(getRegisteredOptions()).toEqual({ buildReport: 'master-css.json' })
  })

  it('adds a CSS manifest webpack loader', () => {
    const nextConfig = withMasterCSS({}) as any
    const webpackConfig = { module: { rules: [] } }
    const resolvedConfig = nextConfig.webpack(webpackConfig as any, {} as any)

    expect(resolvedConfig.module.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        test: expect.any(RegExp),
        use: [
          expect.objectContaining({
            options: {
              virtual: true,
              module: true,
              external: true
            }
          })
        ]
      }),
      expect.objectContaining({
        resourceQuery: /master-css-manifest/,
        use: [
          expect.objectContaining({
            options: {
              module: true,
              external: true
            }
          })
        ]
      }),
      expect.objectContaining({
        test: /\.(css|scss|sass)$/,
        resourceQuery: {
          not: [/master-css-manifest/]
        }
      })
    ]))
    expect(resolvedConfig.resolve.alias[VIRTUAL_MANIFEST_ID]).toContain(join('node_modules', '.master-css', 'master-css-manifest.js'))
    expect(resolvedConfig.resolve.alias[VIRTUAL_EMITTED_GLOBALS_ID]).toContain(join('node_modules', '.master-css', 'master-css-emitted-globals.js'))
    expect(resolvedConfig.resolve.alias[nextInstrumentationClientId]).toContain('instrumentation-client.js')
    expect(resolvedConfig.resolve.alias[masterCSSUserInstrumentationClientId]).toContain('empty.js')
    expect(resolvedConfig.resolve.alias[removedReactPackageName]).toBeUndefined()
    expect(resolvedConfig.resolve.alias[`${removedReactPackageName}$`]).toBeUndefined()
  })

  it('adds a CSS manifest Turbopack loader', () => {
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
                virtual: true,
                module: true,
                external: true
              }
            })
          ],
          type: 'ecmascript'
        }),
        expect.objectContaining({
          condition: {
            all: [
              { path: /\.css$/ },
              { query: /master-css-manifest/ }
            ]
          },
          loaders: [
            expect.objectContaining({
              options: {
                module: true,
                external: true
              }
            })
          ],
          type: 'ecmascript',
          as: '*.js'
        }),
        expect.objectContaining({
          condition: {
            all: [
              { path: /\.(css|scss|sass)$/ },
              { content: expect.any(RegExp) },
              { not: { query: /master-css-manifest/ } }
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
    expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_MANIFEST_ID]).toContain(virtualManifestProjectPath)
    expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_EMITTED_GLOBALS_ID]).toContain(virtualEmittedGlobalsProjectPath)
    expect((nextConfig as any).turbopack.resolveAlias[nextInstrumentationClientId]).toContain(instrumentationClientProjectPath)
    expect((nextConfig as any).turbopack.resolveAlias[masterCSSUserInstrumentationClientId]).toContain('empty.js')
    expect((nextConfig as any).turbopack.resolveAlias[removedReactPackageName]).toBeUndefined()
    expect((nextConfig as any).transpilePackages || []).not.toContain(removedReactPackageName)
  })

  it('adds CSS manifest loaders and runtime aliases without the adapter when mode is runtime', () => {
    const nextConfig = { reactStrictMode: true }
    const resolvedConfig = withMasterCSS(nextConfig, { mode: 'runtime' }) as any

    expect(resolvedConfig.reactStrictMode).toBe(true)
    expect(resolvedConfig.adapterPath).toBeUndefined()
    expect(resolvedConfig.turbopack.resolveAlias[nextInstrumentationClientId]).toContain(instrumentationClientProjectPath)
    expect(resolvedConfig.turbopack.resolveAlias[masterCSSUserInstrumentationClientId]).toContain('empty.js')
    const turbopackConfig = withMasterCSS({
      turbopack: {
        resolveAlias: {
          [nextInstrumentationClientId]: './custom-instrumentation-client.js'
        }
      }
    }, { mode: 'runtime' }) as any
    expect(turbopackConfig.turbopack.resolveAlias[masterCSSUserInstrumentationClientId]).toBe('./custom-instrumentation-client.js')
    const webpackConfig = resolvedConfig.webpack({ module: { rules: [] }, resolve: { alias: {
      [nextInstrumentationClientId]: './custom-instrumentation-client.js'
    } } }, {})
    expect(webpackConfig.resolve.alias[nextInstrumentationClientId]).toContain('instrumentation-client.js')
    expect(webpackConfig.resolve.alias[masterCSSUserInstrumentationClientId]).toBe('./custom-instrumentation-client.js')
  })

  it('preserves an existing user instrumentation-client file behind the Master CSS runtime wrapper', () => {
    const cwd = process.cwd()
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-instrumentation-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src/instrumentation-client.ts'), 'export const marker = true')
    try {
      process.chdir(root)
      const nextConfig = withMasterCSS({}) as any

      expect(nextConfig.turbopack.resolveAlias[masterCSSUserInstrumentationClientId]).toBe('./src/instrumentation-client.ts')
      expect(nextConfig.webpack({ module: { rules: [] } }, {}).resolve.alias[masterCSSUserInstrumentationClientId]).toContain(join('src', 'instrumentation-client.ts'))
    } finally {
      process.chdir(cwd)
    }
  })

  it('generates the runtime instrumentation wrapper as ESM', () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-esm-runtime-'))
    try {
      const source = readGeneratedInstrumentationClientSource(root)

      expect(source).toContain(`import CSSRuntime from '@master/css-runtime'`)
      expect(source).toContain(`import masterCSSManifest from 'virtual:master-css-manifest'`)
      expect(source).toContain('import.meta.turbopackHot')
      expect(source).toContain('import.meta.webpackHot')
      expect(source).not.toContain('require(')
      expect(source).not.toContain('module.hot')
      expect(source).not.toContain('module.exports')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('resolves async virtual manifest modules before starting the runtime', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-async-runtime-'))
    const manifest = { version: 1, marker: 'async-manifest' }
    const emittedGlobals = { variables: { primary: 1 }, animations: {} }
    const { module: cssRuntimeModule, runtime } = createCSSRuntimeTestModule()

    try {
      const source = readGeneratedInstrumentationClientSource(root)

      await runInstrumentationClient(source, {
        'private-next-master-css-user-instrumentation-client': {},
        '@master/css-runtime': cssRuntimeModule,
        'virtual:master-css-manifest': Promise.resolve({ default: manifest }),
        'virtual:master-css-emitted-globals': Promise.resolve({ default: emittedGlobals })
      })

      expect(cssRuntimeModule.default.create).toHaveBeenCalledWith({
        manifest,
        emittedGlobals
      })
      expect(runtime.observe).toHaveBeenCalled()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('keeps sync virtual manifest modules working in the runtime wrapper', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-sync-runtime-'))
    const manifest = { version: 1, marker: 'sync-manifest' }
    const emittedGlobals = { variables: {}, animations: {} }
    const { module: cssRuntimeModule } = createCSSRuntimeTestModule()

    try {
      const source = readGeneratedInstrumentationClientSource(root)

      await runInstrumentationClient(source, {
        'private-next-master-css-user-instrumentation-client': {},
        '@master/css-runtime': cssRuntimeModule,
        'virtual:master-css-manifest': { default: manifest },
        'virtual:master-css-emitted-globals': { default: emittedGlobals }
      })

      expect(cssRuntimeModule.default.create).toHaveBeenCalledWith({
        manifest,
        emittedGlobals
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('adds CSS manifest loaders without runtime aliases or the adapter when mode is null', () => {
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
          type: 'ecmascript'
        }),
        expect.objectContaining({
          condition: {
            all: [
              { path: /\.css$/ },
              { query: /master-css-manifest/ }
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
              { not: { query: /master-css-manifest/ } }
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
        test: expect.any(RegExp)
      }),
      expect.objectContaining({
        resourceQuery: /master-css-manifest/
      }),
      expect.objectContaining({
        test: /\.(css|scss|sass)$/
      })
    ]))
    expect(resolvedConfig.turbopack.resolveAlias[nextInstrumentationClientId]).toBeUndefined()
    expect(resolvedConfig.turbopack.resolveAlias[masterCSSUserInstrumentationClientId]).toBeUndefined()
  })

  it('composes an existing Next adapter path with the Master CSS adapter', () => {
    const cwd = process.cwd()
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-composed-config-'))
    try {
      process.chdir(root)
      const nextConfig = withMasterCSS({
        adapterPath: './external-adapter.js'
      }, {
        adapterOrder: 'external-first'
      }) as any
      const adapterSource = readFileSync(nextConfig.adapterPath, 'utf-8')

      expect(toPosixPath(nextConfig.adapterPath)).toContain(composedAdapterProjectPath)
      expect(adapterSource).toContain('createComposedAdapter(createAdapter(), loadExternalAdapter')
      expect(adapterSource).toContain('const externalAdapterPath = "./external-adapter.js"')
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
      process.env.NEXT_ADAPTER_PATH = './env-adapter.js'
      const nextConfig = withMasterCSS({}) as any
      const adapterSource = readFileSync(nextConfig.adapterPath, 'utf-8')

      expect(toPosixPath(nextConfig.adapterPath)).toContain(composedAdapterProjectPath)
      expect(adapterSource).toContain('const externalAdapterPath = "./env-adapter.js"')
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
    writeFileSync(join(root, 'index.css'), '@master entry;')
    writeFileSync(join(root, 'app/page.tsx'), 'export default function Page() { return <main className="block" /> }')
    try {
      process.chdir(root)
      const nextConfig = await withMasterCSS({}, {
        mode: 'static'
      }) as any

      expect(nextConfig.webpack).toBeUndefined()
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_CSS_ID]).toBe('./.master/next.css')
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_MANIFEST_ID]).toContain(virtualManifestProjectPath)
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_EMITTED_GLOBALS_ID]).toContain(virtualEmittedGlobalsProjectPath)
      expect(nextConfig.turbopack.rules['*']).toEqual(expect.arrayContaining([
        expect.objectContaining({
          condition: {
            path: expect.any(RegExp)
          },
          type: 'ecmascript'
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
              { query: /master-css-manifest/ }
            ]
          }
        }),
        expect.objectContaining({
          condition: expect.objectContaining({
            all: expect.arrayContaining([
              { path: expect.any(RegExp) },
              { content: expect.any(RegExp) },
              { not: { query: /master-css-manifest/ } }
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
