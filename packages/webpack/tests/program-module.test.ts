import { describe, expect, test, vi } from 'vitest'
import { AsyncSeriesHook, SyncHook } from 'tapable'
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import webpack from 'webpack'
import { createEngineSync } from '@master/css/node'
import { MASTER_CSS_PROGRAM_QUERY, VIRTUAL_PROGRAM_ID } from '@master/css-internal/program-module'
import MasterCSSWebpackPlugin from '../src'
import type { MasterCSSWebpackContext } from '../src/plugin'
import BuiltPlugin from '../dist/index.js'

const PROGRAM_ASSET = /^master-css-program\.[a-f0-9]{8}\.bin$/

function withRoot<T>(run: (root: string) => Promise<T>) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'master-css-webpack-program-')))
  writeFileSync(path.join(root, 'app.css'), '@import "@master/css";\n@utility card { display: block; }')
  return run(root).finally(() => rmSync(root, { recursive: true, force: true }))
}

/** The CSS a program renders for classes, through the native engine. */
function render(program: Uint8Array, classNames: string[]) {
  using engine = createEngineSync({ program })
  return engine.ensureClassRules(classNames).mutations.map(mutation => mutation.op === 'insert' ? mutation.text : '').join('')
}

function decodeInlineProgram(moduleContent: string) {
  const base64 = moduleContent.match(/atob\("([^"]*)"\)/)?.[1]
  expect(base64, moduleContent).toBeTypeOf('string')
  return new Uint8Array(Buffer.from(base64!, 'base64'))
}

function setup(root: string, mode: 'development' | 'production', resolvedPath?: string) {
  const plugin = new MasterCSSWebpackPlugin({}, root)
  let context: MasterCSSWebpackContext | undefined
  const host = plugin as unknown as { createContext(compiler: unknown): MasterCSSWebpackContext }
  const createContext = host.createContext.bind(plugin)
  host.createContext = compiler => (context = createContext(compiler))
  const compiler = {
    hooks: {
      ...Object.fromEntries(['beforeRun', 'watchRun', 'shutdown'].map(name => [name, new AsyncSeriesHook<[unknown]>(['value'])])),
      ...Object.fromEntries(['initialize', 'afterEnvironment', 'afterResolvers', 'thisCompilation'].map(name => [name, new SyncHook<[unknown]>(['value'])])),
      normalModuleFactory: new SyncHook<[unknown]>(['normalModuleFactory'])
    },
    context: root,
    options: { mode, module: { rules: [] }, output: {} },
    webpack: { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } },
    inputFileSystem: { _writeVirtualFile: vi.fn() },
    resolverFactory: { hooks: { resolver: { for: () => ({ tap: () => {} }) } } }
  }
  plugin.apply(compiler as never)
  const normalModuleFactory = {
    hooks: { beforeResolve: new AsyncSeriesHook<[any]>(['resolveData']) },
    getResolver: () => ({ resolve: (...args: unknown[]) => (args.at(-1) as (error: null, result?: string) => void)(null, resolvedPath) })
  }
  compiler.hooks.normalModuleFactory.call(normalModuleFactory)
  const resolve = async (request: string) => {
    const resolveData = { request, context: root, contextInfo: {}, fileDependencies: new Set<string>() }
    await new Promise<void>((done, fail) => normalModuleFactory.hooks.beforeResolve.callAsync(resolveData, error => error ? fail(error) : done()))
    return resolveData
  }
  const written = (modulePath: string) => compiler.inputFileSystem._writeVirtualFile.mock.calls
    .filter(([file]) => file === modulePath).map(([, , content]) => String(content))
  return { plugin, context: () => context!, resolve, written }
}

describe('virtual:master-css-program', () => {
  test('emits the production program compiled without source provenance and fetches it', () => withRoot(async root => {
    const { plugin, resolve, written } = setup(root, 'production')
    const resolveData = await resolve(VIRTUAL_PROGRAM_ID)
    const modulePath = path.join(root, 'node_modules', '.master-css', 'master-css-program.js')
    expect(resolveData.request).toBe(modulePath)
    expect(resolveData.fileDependencies.has(path.join(root, 'app.css'))).toBe(true)
    const [assetFileName, program] = [...plugin.programAssets].at(-1)!
    expect(assetFileName).toMatch(PROGRAM_ASSET)
    expect(written(modulePath).at(-1)).toContain(`const masterCSSProgramURL = __webpack_public_path__ + ${JSON.stringify(assetFileName)};`)
    expect(written(modulePath).at(-1)).toContain('await fetch(masterCSSProgramURL)')
    expect(render(program, ['card'])).toBe('.card{display:block}')
    expect(Buffer.from(program).includes(root)).toBe(false)
    expect([...plugin.manifestJSONAssets]).toEqual([])
  }))

  test('inlines the development program with source provenance', () => withRoot(async root => {
    const { plugin, resolve, written } = setup(root, 'development')
    const { request } = await resolve(VIRTUAL_PROGRAM_ID)
    const moduleContent = written(request).at(-1)!
    expect(moduleContent).toMatch(/^const masterCSSProgram = atob\(/)
    expect(moduleContent).not.toContain('fetch(')
    const program = decodeInlineProgram(moduleContent)
    expect(render(program, ['card'])).toBe('.card{display:block}')
    expect(Buffer.from(program).includes(root)).toBe(true)
    expect([...plugin.programAssets]).toEqual([])
  }))

  test('keeps program file dependencies after invalid CSS', () => withRoot(async root => {
    const entryPath = path.join(root, 'app.css')
    writeFileSync(entryPath, '@import "@master/css";\n@utility card { @compose bg-missing-token; }')
    const { resolve } = setup(root, 'production')
    const failed = resolve(VIRTUAL_PROGRAM_ID)
    await expect(failed).rejects.toThrow('@compose has been removed')
    writeFileSync(entryPath, '@import "@master/css";\n@utility card { display: grid; }')
    const resolveData = await resolve(VIRTUAL_PROGRAM_ID)
    expect(resolveData.fileDependencies.has(entryPath)).toBe(true)
  }))

  test('recompiles the default program on manifest updates only once a build imports it', () => withRoot(async root => {
    const { plugin, context, resolve, written } = setup(root, 'development')
    const modulePath = context().virtualProgramModuleId
    const initialWrites = written(modulePath).length
    // Static builds that never import the program do not compile it.
    await context().writeDefaultManifestModules()
    expect(written(modulePath)).toHaveLength(initialWrites)
    expect(written(context().virtualManifestModuleId).at(-1)).toMatch(/^export default \{"version":6/)

    await resolve(VIRTUAL_PROGRAM_ID)
    writeFileSync(path.join(root, 'app.css'), '@import "@master/css";\n@utility card { display: grid; }')
    await context().writeDefaultManifestModules()
    expect(render(decodeInlineProgram(written(modulePath).at(-1)!), ['card'])).toBe('.card{display:grid}')
    expect([...plugin.programAssets]).toEqual([])
  }))
})

describe('?master-css-program', () => {
  const themePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')

  test.each(['production', 'development'] as const)('compiles the CSS entry program in %s', async mode => {
    const { plugin, resolve, written } = setup(path.dirname(themePath), mode, themePath)
    const resolveData = await resolve('./theme.css' + MASTER_CSS_PROGRAM_QUERY)
    expect(resolveData.request).toContain(path.join('node_modules', '.master-css'))
    expect(resolveData.request).toMatch(/\.program\.js$/)
    expect(resolveData.fileDependencies.has(themePath)).toBe(true)
    const moduleContent = written(resolveData.request).at(-1)!
    const program = mode === 'production' ? [...plugin.programAssets].at(-1)![1] : decodeInlineProgram(moduleContent)
    if (mode === 'production') expect(moduleContent).toContain(`__webpack_public_path__ + ${JSON.stringify([...plugin.programAssets].at(-1)![0])}`)
    else expect([...plugin.programAssets]).toEqual([])
    expect(render(program, ['fg-accent'])).toBe(':root,:host{--color-accent:#456}.fg-accent{color:var(--color-accent)}')
  })

  test('rejects queries on files that are not CSS entries', async () => {
    const scriptPath = path.resolve(__dirname, 'program-module.test.ts')
    const { resolve } = setup(path.dirname(scriptPath), 'production', scriptPath)
    await expect(resolve('./program-module.test.ts' + MASTER_CSS_PROGRAM_QUERY))
      .rejects.toThrow('Master CSS program queries only support CSS entry files.')
  })
})

function build(root: string, mode: 'runtime' | 'progressive', entry: string) {
  writeFileSync(path.join(root, 'entry.js'), entry)
  return new Promise<{ files: string[], read: (file: string) => Buffer }>((resolve, reject) => webpack({
    mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false },
    output: { path: path.join(root, 'dist'), filename: '[name].js', chunkFilename: '[name].[contenthash:8].js', publicPath: './' },
    plugins: [new BuiltPlugin({ mode }, root), {
      apply(compiler: webpack.Compiler) {
        compiler.hooks.thisCompilation.tap('Fixture', compilation => compilation.hooks.processAssets.tap({
          name: 'Fixture', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        }, () => compilation.emitAsset('index.html', new compiler.webpack.sources.RawSource('<html><head></head><body></body></html>'))))
      }
    }]
  }, (error, stats) => {
    if (error || !stats || stats.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })))
    else resolve({ files: readdirSync(path.join(root, 'dist'), { recursive: true }) as string[], read: file => readFileSync(path.join(root, 'dist', file)) })
  }))
}

describe('Webpack program delivery', () => {
  test('runtime pages import and preload the default program but no manifest', () => withRoot(async root => {
    writeFileSync(path.join(root, 'theme.css'), '@theme { --color-accent: #456; }')
    const { files, read } = await build(root, 'runtime', 'import program from "./theme.css?master-css-program";globalThis.themeProgram=program')
    const programs = files.filter(file => PROGRAM_ASSET.test(file))
    expect(programs).toHaveLength(2)
    expect(files.filter(file => file.includes('master-css-manifest'))).toEqual([])
    const [defaultProgram] = programs.filter(file => read('master-css-runtime.js').includes(file))
    const [themeProgram] = programs.filter(file => file !== defaultProgram)
    expect(render(new Uint8Array(read(defaultProgram)), ['card'])).toBe('.card{display:block}')
    expect(render(new Uint8Array(read(themeProgram)), ['fg-accent'])).toContain('--color-accent:#456')
    for (const program of programs) expect(read(program).includes(root)).toBe(false)
    const html = read('index.html').toString()
    // Only the program the runtime entry fetches is preloaded, as a CORS fetch.
    expect(html).toMatch(new RegExp(`<link rel=["']?preload["']? as=["']?fetch["']? crossorigin href=["']?\\./${defaultProgram.replaceAll('.', '\\.')}["']?>`))
    expect(html).not.toContain(themeProgram)
    expect(html).not.toContain('master-css-manifest')
  }), 120000)

  test('progressive pages load the program from a lazy chunk without preloading it', () => withRoot(async root => {
    const { files, read } = await build(root, 'progressive', 'console.log("progressive")')
    const [program] = files.filter(file => PROGRAM_ASSET.test(file))
    expect(program).toBeTruthy()
    expect(render(new Uint8Array(read(program)), ['card'])).toBe('.card{display:block}')
    expect(read('master-css-runtime.js').includes(program)).toBe(false)
    expect(files.filter(file => file.endsWith('.js') && read(file).includes(program))).toHaveLength(1)
    const html = read('index.html').toString()
    expect(html).not.toContain(program)
    expect(html).not.toContain('application/wasm')
    expect(html).toMatch(/<script defer src=["']?\.\/master-css-runtime\.js/)
  }), 120000)
})
