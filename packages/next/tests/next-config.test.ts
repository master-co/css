import { describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import withMasterCSS from '../src'
import { getRegisteredOptions } from '../src/options'
import { VIRTUAL_MANIFEST_ID } from '@master/css-internal/manifest-module'
import { VIRTUAL_PROGRAM_ID } from '@master/css-internal/program-module'
import { VIRTUAL_CSS_ID } from '@master/css-internal/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-internal/emitted-globals-module'

const toPosixPath = (value: string) => value.replace(/\\/g, '/')
const virtualManifestProjectPath = 'node_modules/.master-css/master-css-manifest.js'
const virtualProgramProjectPath = 'node_modules/.master-css/master-css-program.js'
const virtualEmittedGlobalsProjectPath = 'node_modules/.master-css/master-css-emitted-globals.js'
const composedAdapterProjectPath = 'node_modules/.master-css/master-css-next-adapter.js'
const instrumentationClientProjectPath = 'node_modules/.master-css/master-css-next-instrumentation-client.js'
const nextInstrumentationClientId = 'private-next-instrumentation-client'
const masterCSSUserInstrumentationClientId = 'private-next-master-css-user-instrumentation-client'
const removedReactPackageName = ['@master', 'css.react'].join('/')
const moduleQuery = /master-css-manifest|master-css-program/

function readGeneratedInstrumentationClientSource(root: string, mode: 'runtime' | 'progressive' = 'runtime') {
  const cwd = process.cwd()
  try {
    process.chdir(root)
    withMasterCSS({}, { mode })
    return readFileSync(join(root, 'node_modules', '.master-css', 'master-css-next-instrumentation-client.js'), 'utf-8')
  } finally {
    process.chdir(cwd)
  }
}

const AsyncFunction = async function () { }.constructor as new (...args: string[]) => (...args: unknown[]) => Promise<void>

function toRunnableInstrumentationClientSource(source: string) {
  return source
    .replace(`import 'private-next-master-css-user-instrumentation-client'`, `await importModule('private-next-master-css-user-instrumentation-client')`)
    .replace(`import { MasterCSSRuntime } from '@master/css-runtime'`, `const { MasterCSSRuntime } = await importModule('@master/css-runtime')`)
    .replace(`import masterCSSProgram from 'virtual:master-css-program'`, `const masterCSSProgram = await importDefault('virtual:master-css-program')`)
    .replace(`import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'`, `const masterCSSEmittedGlobals = await importDefault('virtual:master-css-emitted-globals')`)
    .replaceAll(`import('virtual:master-css-program')`, `importModule('virtual:master-css-program')`)
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

function createMasterCSSRuntimeTestModule() {
  const runtime = {
    dispose: vi.fn(),
    needsHydrationManifest: vi.fn(() => false),
    loadHydrationManifest: vi.fn(),
    observe: vi.fn()
  }
  runtime.observe.mockReturnValue(runtime)

  return {
    runtime,
    module: {
      MasterCSSRuntime: {
        create: vi.fn(() => runtime),
        start: vi.fn(async () => runtime)
      }
    }
  }
}

describe('withMasterCSS', () => {
  it('routes native CSS and CSS Modules through the project context without a directive gate', () => {
    const config = withMasterCSS({}, { mode: 'progressive' }) as any
    const rules = config.turbopack.rules['*'] as any[]
    const styleRules = rules.filter(rule => rule.loaders?.some((loader: any) => typeof loader.loader === 'string' && toPosixPath(loader.loader).endsWith('/stylesheet-loader.js')))
    expect(styleRules.map(rule => rule.type)).toEqual(['css', undefined])
    for (const rule of styleRules) {
      expect(rule.condition.all.some((condition: any) => condition.content)).toBe(false)
      expect(rule.condition.all.some((condition: any) => condition.not?.path?.test('/project/.master/stylesheets/' + 'a'.repeat(64) + '/' + 'b'.repeat(64) + '-entry.css'))).toBe(true)
    }
  })

  it('sets the Next adapter path and registers options', () => {
    const nextConfig = withMasterCSS({ reactStrictMode: true }, { mode: 'progressive', buildReport: 'master-css.json' })

    expect(nextConfig.reactStrictMode).toBe(true)
    expect(nextConfig.adapterPath).toContain('adapter.js')
    expect(getRegisteredOptions()).toEqual({ mode: 'progressive', buildReport: 'master-css.json' })
  })

  it('adds a CSS manifest webpack loader', () => {
    const nextConfig = withMasterCSS({}, { mode: 'progressive' }) as any
    const webpackConfig = { module: { rules: [] } }
    const resolvedConfig = nextConfig.webpack(webpackConfig as any, {} as any)

    expect(resolvedConfig.module.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        test: expect.any(RegExp),
        use: [
          expect.objectContaining({
            options: {
              virtual: true,
              module: true
            }
          })
        ]
      }),
      expect.objectContaining({
        test: expect.any(RegExp),
        use: [
          expect.objectContaining({
            options: {
              virtual: true,
              program: true
            }
          })
        ]
      }),
      expect.objectContaining({
        resourceQuery: /master-css-manifest/,
        use: [
          expect.objectContaining({
            options: {
              module: true
            }
          })
        ]
      }),
      expect.objectContaining({
        resourceQuery: /master-css-program/,
        use: [
          expect.objectContaining({
            options: {
              program: true
            }
          })
        ]
      }),
      expect.objectContaining({
        test: expect.any(RegExp),
        use: [
          expect.objectContaining({
            options: {
              emittedGlobals: true
            }
          })
        ]
      })
    ]))
    expect(resolvedConfig.module.rules.some((rule: { test?: RegExp }) => rule.test?.test('/tmp/example.css'))).toBe(false)
    expect(resolvedConfig.resolve.alias[VIRTUAL_MANIFEST_ID]).toContain(join('node_modules', '.master-css', 'master-css-manifest.js'))
    expect(resolvedConfig.resolve.alias[VIRTUAL_PROGRAM_ID]).toContain(join('node_modules', '.master-css', 'master-css-program.js'))
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
    }, { mode: 'progressive' })

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
                module: true
              }
            })
          ],
          type: 'ecmascript'
        }),
        expect.objectContaining({
          condition: {
            path: expect.any(RegExp)
          },
          loaders: [
            expect.objectContaining({
              options: {
                virtual: true,
                program: true
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
                module: true
              }
            })
          ],
          type: 'ecmascript'
        }),
        expect.objectContaining({
          condition: {
            all: [
              { path: /\.css$/ },
              { query: /master-css-program/ }
            ]
          },
          loaders: [
            expect.objectContaining({
              options: {
                program: true
              }
            })
          ],
          type: 'ecmascript'
        }),
        expect.objectContaining({
          condition: {
            path: expect.any(RegExp)
          },
          loaders: [
            expect.objectContaining({
              options: {
                emittedGlobals: true
              }
            })
          ],
          type: 'ecmascript'
        }),
        expect.objectContaining({
          condition: {
            all: [
              { path: /\.(css|scss|sass)$/ },
              { not: { path: /\.module\.(css|scss|sass)$/ } },
              { not: { path: expect.any(RegExp) } },
              { not: { query: moduleQuery } }
            ]
          },
          type: 'css'
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
    expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_PROGRAM_ID]).toContain(virtualProgramProjectPath)
    expect((nextConfig as any).turbopack.resolveAlias[VIRTUAL_EMITTED_GLOBALS_ID]).toContain(virtualEmittedGlobalsProjectPath)
    expect((nextConfig as any).turbopack.resolveAlias[nextInstrumentationClientId]).toContain(instrumentationClientProjectPath)
    expect((nextConfig as any).turbopack.resolveAlias[masterCSSUserInstrumentationClientId]).toContain('empty.js')
    expect((nextConfig as any).turbopack.resolveAlias[removedReactPackageName]).toBeUndefined()
    expect((nextConfig as any).transpilePackages || []).not.toContain(removedReactPackageName)
  })

  it('adds CSS manifest loaders, runtime aliases and stylesheet delivery adapter in runtime mode', () => {
    const nextConfig = { reactStrictMode: true }
    const resolvedConfig = withMasterCSS(nextConfig, { mode: 'runtime' }) as any

    expect(resolvedConfig.reactStrictMode).toBe(true)
    expect(resolvedConfig.adapterPath).toContain('adapter.js')
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

  it('provides an array of instrumentation modules to Next hydration for both bundlers', () => {
    const config = withMasterCSS({}, { mode: 'runtime' }) as any
    const webpackConfig = config.webpack({ module: { rules: [] } }, {})
    for (const aliases of [config.turbopack.resolveAlias, webpackConfig.resolve.alias]) {
      const runtimeModule = { marker: 'runtime' }
      for (const id of [
        '../lib/require-instrumentation-client',
        '../lib/require-instrumentation-client.js',
        'next/dist/lib/require-instrumentation-client',
        'next/dist/esm/lib/require-instrumentation-client'
      ]) {
        const source = readFileSync(aliases[id], 'utf-8')
        const module = { exports: undefined as unknown }
        const require = vi.fn(() => runtimeModule)
        new Function('module', 'require', source)(module, require)
        expect(require).toHaveBeenCalledWith('./master-css-next-instrumentation-client.js')
        expect(module.exports).toEqual([runtimeModule])
      }
    }
  })

  it('preserves an existing user instrumentation-client file behind the Master CSS runtime wrapper', () => {
    const cwd = process.cwd()
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-instrumentation-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src/instrumentation-client.ts'), 'export const marker = true')
    try {
      process.chdir(root)
      const nextConfig = withMasterCSS({}, { mode: 'progressive' }) as any

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

      expect(source).toContain(`import { MasterCSSRuntime } from '@master/css-runtime'`)
      expect(source).toContain(`import masterCSSProgram from 'virtual:master-css-program'`)
      expect(source).not.toContain('virtual:master-css-manifest')
      expect(source).toContain('import.meta.turbopackHot')
      expect(source).toContain('import.meta.webpackHot')
      expect(source).not.toContain('require(')
      expect(source).not.toContain('module.hot')
      expect(source).not.toContain('module.exports')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('resolves async virtual program modules before starting the runtime', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-async-runtime-'))
    const program = new Uint8Array([1, 2, 3])
    const emittedGlobals = { variables: { primary: 1 }, animations: {} }
    const { module: runtimeModule, runtime } = createMasterCSSRuntimeTestModule()

    try {
      const source = readGeneratedInstrumentationClientSource(root)

      await runInstrumentationClient(source, {
        'private-next-master-css-user-instrumentation-client': {},
        '@master/css-runtime': runtimeModule,
        'virtual:master-css-program': Promise.resolve({ default: program }),
        'virtual:master-css-emitted-globals': Promise.resolve({ default: emittedGlobals })
      })

      expect(runtimeModule.MasterCSSRuntime.start).toHaveBeenCalledWith({
        program,
        emittedGlobals,
        onDiagnostic: expect.any(Function),
        stylesheetDelivery: { base: '/_next/', development: false }
      })
      expect(runtime.observe).toHaveBeenCalled()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('loads the progressive runtime program only when the runtime engine starts', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-progressive-runtime-'))
    const program = new Uint8Array([4, 5, 6])
    const emittedGlobals = { variables: {}, animations: {} }
    const { module: runtimeModule } = createMasterCSSRuntimeTestModule()

    try {
      const source = readGeneratedInstrumentationClientSource(root, 'progressive')
      expect(source).not.toContain(`import masterCSSProgram from 'virtual:master-css-program'`)
      expect(source).not.toContain('virtual:master-css-manifest')

      const { importModule } = await runInstrumentationClient(source, {
        'private-next-master-css-user-instrumentation-client': {},
        '@master/css-runtime': runtimeModule,
        'virtual:master-css-program': Promise.resolve({ default: program }),
        'virtual:master-css-emitted-globals': { default: emittedGlobals }
      })

      const [[options]] = runtimeModule.MasterCSSRuntime.start.mock.calls as unknown as [[{ program: () => Promise<unknown> }]]
      expect(importModule).not.toHaveBeenCalledWith('virtual:master-css-program')
      await expect(options.program()).resolves.toBe(program)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('keeps sync virtual program modules working in the runtime wrapper', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-sync-runtime-'))
    const program = new Uint8Array([7, 8, 9])
    const emittedGlobals = { variables: {}, animations: {} }
    const { module: runtimeModule } = createMasterCSSRuntimeTestModule()

    try {
      const source = readGeneratedInstrumentationClientSource(root)

      await runInstrumentationClient(source, {
        'private-next-master-css-user-instrumentation-client': {},
        '@master/css-runtime': runtimeModule,
        'virtual:master-css-program': { default: program },
        'virtual:master-css-emitted-globals': { default: emittedGlobals }
      })

      expect(runtimeModule.MasterCSSRuntime.start).toHaveBeenCalledWith({
        program,
        emittedGlobals,
        onDiagnostic: expect.any(Function),
        stylesheetDelivery: { base: '/_next/', development: false }
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('serves virtual:master-css-program through the program loader for both bundlers', () => {
    const cwd = process.cwd()
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-program-'))
    try {
      process.chdir(root)
      const config = withMasterCSS({}, { mode: 'runtime' }) as any
      const webpackConfig = config.webpack({ module: { rules: [] } }, {})
      const programPath = webpackConfig.resolve.alias[VIRTUAL_PROGRAM_ID]
      const isProgramLoader = (loader: any) => loader.options?.virtual === true && loader.options?.program === true
      const webpackRules = webpackConfig.module.rules.filter((rule: any) => rule.use?.some(isProgramLoader))
      expect(webpackRules).toHaveLength(1)
      expect(webpackRules[0].test.test(programPath)).toBe(true)
      expect(webpackRules[0].test.test(webpackConfig.resolve.alias[VIRTUAL_MANIFEST_ID])).toBe(false)
      const turbopackRules = config.turbopack.rules['*'].filter((rule: any) => rule.loaders?.some(isProgramLoader))
      expect(turbopackRules).toHaveLength(1)
      expect(turbopackRules[0].condition.path.test(config.turbopack.resolveAlias[VIRTUAL_PROGRAM_ID])).toBe(true)
      expect(turbopackRules[0].condition.path.test(config.turbopack.resolveAlias[VIRTUAL_MANIFEST_ID])).toBe(false)
      // The loader replaces the generated placeholder, so it never runs unprocessed.
      expect(() => new Function(readFileSync(programPath, 'utf-8'))()).toThrow('requires the Master CSS program loader')
    } finally {
      process.chdir(cwd)
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('routes CSS program query imports away from stylesheet processing', () => {
    const config = withMasterCSS({}, { mode: 'progressive' }) as any
    for (const glob of ['*.js', '*.cjs', '*.ts']) {
      const content = config.turbopack.rules[glob][0].condition.all[1].content as RegExp
      expect(content.test('import program from "./theme.css?master-css-program"')).toBe(true)
      expect(content.test('import manifest from "./theme.css?master-css-manifest"')).toBe(true)
      expect(content.test('import styles from "./theme.css"')).toBe(false)
    }
    // Every rule that does not produce JavaScript processes CSS, including CSS Modules.
    const cssRules = (config.turbopack.rules['*'] as any[]).filter(rule => rule.type !== 'ecmascript')
    expect(cssRules).toHaveLength(3)
    for (const rule of cssRules) {
      const exclusion = rule.condition.all.find((condition: any) => condition.not?.query)?.not.query as RegExp
      expect(exclusion.test('?master-css-program')).toBe(true)
      expect(exclusion.test('?master-css-manifest')).toBe(true)
    }
  })

  it('returns the original config when disabled', () => {
    const nextConfig = { reactStrictMode: true }
    const resolvedConfig = withMasterCSS(nextConfig, { enabled: false }) as any

    expect(resolvedConfig).toBe(nextConfig)
  })

  it('rejects runtime switches that contradict the selected mode', () => {
    expect(() => withMasterCSS({}, { mode: 'runtime', runtime: false })).toThrow(/runtime/)
    expect(() => withMasterCSS({}, { mode: 'static', runtime: true })).toThrow(/runtime/)
  })

  it('composes an existing Next adapter path with the Master CSS adapter', () => {
    const cwd = process.cwd()
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-composed-config-'))
    try {
      process.chdir(root)
      const nextConfig = withMasterCSS({
        adapterPath: './external-adapter.js'
      }, {
        mode: 'progressive',
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
      const nextConfig = withMasterCSS({}, { mode: 'progressive' }) as any
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

  it('defaults to static mode with Turbopack rules without a runtime bootstrap', async () => {
    const cwd = process.cwd()
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-config-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    writeFileSync(join(root, 'index.css'), "@import url(\"@master/css\");")
    writeFileSync(join(root, 'app/page.tsx'), "export default function Page() { return <main className=\"display:block\" /> }")
    try {
      process.chdir(root)
      const nextConfig = await withMasterCSS({}) as any

      expect(nextConfig.webpack).toBeTypeOf('function')
      const webpackConfig = nextConfig.webpack({ module: { rules: [] } }, {})
      expect(webpackConfig.resolve.alias[VIRTUAL_CSS_ID]).toBe(join(realpathSync(root), '.master/next.css'))
      expect(webpackConfig.resolve.alias[nextInstrumentationClientId]).toBeUndefined()
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_CSS_ID]).toBe('./.master/next.css')
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_MANIFEST_ID]).toContain(virtualManifestProjectPath)
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_PROGRAM_ID]).toContain(virtualProgramProjectPath)
      expect(nextConfig.turbopack.resolveAlias[VIRTUAL_EMITTED_GLOBALS_ID]).toContain(virtualEmittedGlobalsProjectPath)
      const staticRules = nextConfig.turbopack.rules['*'] as { condition?: { all?: { path?: RegExp, not?: string }[] }, loaders?: { loader: string }[] }[]
      expect(staticRules.flatMap(rule => rule.loaders ?? []).some(loader => /static-loader\.js$/.test(loader.loader))).toBe(false)
      expect(staticRules.some(rule => rule.condition?.all?.some(condition => condition.path?.test(join(root, '.master/next.css')))
        && rule.loaders?.some(loader => /static-css-loader\.js$/.test(loader.loader)))).toBe(true)
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
              { not: { path: expect.any(RegExp) } },
              { not: { query: moduleQuery } }
            ])
          }),
          type: 'css'
        })
      ]))
    } finally {
      process.chdir(cwd)
    }
  })
})
