import { expect, test } from 'vitest'
import RuntimeHTMLAssetsPlugin from '../src/plugins/runtime-html-assets'
import RuntimeEntryPlugin from '../src/plugins/runtime-entry'

test.each([
  { publicPath: './', prefix: '../../' },
  { publicPath: '', prefix: '../../' },
  { publicPath: 'auto', prefix: '../../' },
  { publicPath: 'files/', prefix: '../../files/' },
  { publicPath: '/static/', prefix: '/static/' },
  { publicPath: 'https://cdn.example.test/static/', prefix: 'https://cdn.example.test/static/' },
  { publicPath: '//cdn.example.test/static/', prefix: '//cdn.example.test/static/' }
])('BH-0017 emitted HTML resolves all asset types with $publicPath', ({ publicPath, prefix }) => {
  for (const module of [false, true]) {
    const assets: Record<string, { source: () => string }> = {
      'pages/deep/index.html': { source: () => '<html><head></head><body></body></html>' },
      'binary/mastercss_binding_wasm_engine_bg.wasm': { source: () => 'wasm' }
    }
    const handlers: ((values: typeof assets) => void)[] = []
    const compilation = {
      assets,
      outputOptions: { publicPath, module },
      entrypoints: new Map([['runtime', { getFiles: () => ['js/runtime.js'] }]]),
      hooks: { processAssets: { tap: (_options: unknown, handler: typeof handlers[number]) => handlers.push(handler) } },
      updateAsset: (name: string, value: typeof assets[string]) => { assets[name] = value }
    }
    const compiler = {
      webpack: {
        Compilation: { PROCESS_ASSETS_STAGE_OPTIMIZE: 100, PROCESS_ASSETS_STAGE_REPORT: 500 },
        sources: { RawSource: class { constructor(private value: string) {} source() { return this.value } } }
      },
      hooks: { thisCompilation: { tap: (_name: string, callback: (value: typeof compilation) => void) => callback(compilation) } }
    }
    RuntimeHTMLAssetsPlugin({ name: 'test', runtimeEntryName: 'runtime', shouldPreloadRuntime: () => true, getManifestJSONAssets: () => [['data/manifest.json', '{}']] } as never).apply(compiler as never)
    for (const handler of handlers) handler(assets)
    const html = assets['pages/deep/index.html'].source()
    for (const [attribute, file] of [['src', 'js/runtime.js'], ['href', 'js/runtime.js'], ['href', 'data/manifest.json'], ['href', 'binary/mastercss_binding_wasm_engine_bg.wasm']]) {
      expect(html.split(`${attribute}="${prefix}${file}"`)).toHaveLength(2)
    }
    expect(html).toContain(module ? 'rel="modulepreload"' : 'rel="preload" as="script"')
    expect(html).toContain(module ? '<script type="module"' : '<script defer')
  }
})

test.each(['./', '', 'files/', 'auto', '/static/', 'https://cdn.example.test/', '//cdn.example.test/'])('BH-0017 runtime entry owns dependency resolution for %j', publicPath => {
  const entries: { name: string, publicPath?: string }[] = []
  const compiler = {
    context: '/project', options: { output: { publicPath } },
    webpack: { EntryPlugin: class {
      constructor(_root: string, _request: string, options: typeof entries[number]) { entries.push(options) }
      apply() {}
    } }
  }
  RuntimeEntryPlugin({ runtimeEntryName: 'runtime' } as never).apply(compiler as never)
  expect(entries).toEqual([{ name: 'runtime', ...(['./', '', 'files/'].includes(publicPath) ? { publicPath: 'auto' } : {}) }])
  expect(compiler.options.output.publicPath).toBe(publicPath)
})
