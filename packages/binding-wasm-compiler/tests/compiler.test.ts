import { readFile } from 'node:fs/promises'
import { expect, test, vi } from 'vitest'
import { initCompilerWasm } from '../src'

function toPlainValue(value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries([...value].map(([key, child]) => [key, toPlainValue(child)]))
  }
  if (Array.isArray(value)) return value.map(toPlainValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, toPlainValue(child)]))
  }
  return value
}

test('keys explicit compiler modules by their initialization input', async () => {
  const module = {
    default: vi.fn(async () => ({})),
    bindingInfo: () => ({})
  }
  const input = new Uint8Array([1])

  await initCompilerWasm({ module, input })
  await initCompilerWasm({ module, input })
  expect(module.default).toHaveBeenCalledTimes(1)
  await expect(initCompilerWasm({
    module,
    input: new Uint8Array([2])
  })).rejects.toMatchObject({
    code: 'WASM_INPUT_CONFLICT',
    domain: 'binding'
  })
})

test('normalizes compiler Wasm initialization failures', async () => {
  const cause = new TypeError('fetch failed')
  await expect(initCompilerWasm({
    module: {
      default: vi.fn(async () => {
        throw cause
      })
    },
    input: new Uint8Array([1])
  })).rejects.toMatchObject({
    code: 'WASM_LOAD_FAILED',
    domain: 'binding',
    cause
  })
})

test('loads the isolated compiler Wasm surface', async () => {
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_compiler_bg.wasm',
    import.meta.url
  )))
  const compiler = await initCompilerWasm({ input })
  const entry = '@import "@master/css";'
  expect(compiler.inspectCSS(entry)).toMatchObject({
    hasMasterCSSImport: true,
    hasMasterEntry: true
  })
  expect(compiler.compileNativeCSS('.card { color: red; }')).toMatchObject({
    css: '.card {\n  color: red;\n}',
    nativeCSS: '.card {\n  color: red;\n}'
  })
  const theme = [{ type: 'rule', prelude: '.dark', children: [
    { type: 'declaration', name: 'color-brand', value: '#fff' }
  ] }]
  expect(compiler.compileCSSDirectives("@theme { .dark { --color-brand: #fff; } }\n")).toMatchObject({
    manifestInput: { theme }, nativeCSS: ''
  })
  expect(toPlainValue(compiler.compileManifestInput({
    theme,
    utilities: [{ name: 'card', declarations: { color: 'red' } }]
  }))).toMatchObject({
    manifest: {
      version: 2, languageVersion: 4, theme,
      variables: { color: [{ name: 'color-brand', key: 'brand', values: [{ path: ['.dark'], value: '#fff' }] }] },
      utilities: [{ name: 'card', emit: { rules: [{ declarations: { color: 'red' } }] } }]
    }
  })
  expect(toPlainValue(compiler.compileManifestInput({
    utilities: [{ name: 'text:*', type: 'dynamic', dynamic: { key: 'text' }, declarations: {
      'font-size': '--master-value()',
      'line-height': 'calc(--master-value() * 1.5)'
    } }]
  }))).toMatchObject({ manifest: { utilities: [{ emit: { rules: [{ declarations: {
    'font-size': null, 'line-height': ['calc(', null, ' * 1.5)']
  } }] } }] } })
  // Match rather than equal: the graph also carries sourceMappings, whose
  // contents are the compiler crate's contract, not this surface check's.
  expect(compiler.resolveCSSImportGraph({
    entry: '/entry.css',
    files: {
      '/entry.css': '@import "./theme.css";.entry{display:block}',
      '/theme.css': "@theme {:root, :host {--color-brand:red}}\n"
    },
    edges: [{ from: '/entry.css', specifier: './theme.css', resolved: '/theme.css' }]
  })).toMatchObject({
    source: "@theme {:root, :host {--color-brand:red}}\n.entry{display:block}",
    dependencies: ['/entry.css', '/theme.css']
  })
  expect(compiler.filterCSSExtractionCandidates(
    ['bg-red', 'fg-red'],
    [{ source: '^bg-', flags: 'g' }]
  )).toEqual(['fg-red'])

  const files = Object.fromEntries(await Promise.all(
    ['index.css', 'base.css', 'theme.css', 'colors.css', 'variants.css', 'utilities.css']
      .map(async file => [`/${file}`, await readFile(new URL(`../../preset/src/${file}`, import.meta.url), 'utf8')])
  ))
  const graph = compiler.resolveCSSImportGraph({
    entry: '/index.css', files,
    edges: [
      ...['base.css', 'theme.css', 'variants.css', 'utilities.css'].map(file => ({ from: '/index.css', specifier: `./${file}`, resolved: `/${file}` })),
      { from: '/theme.css', specifier: './colors.css', resolved: '/colors.css' }
    ]
  }) as { source: string }
  const presetDirectives = compiler.compileCSSDirectives(graph.source) as {
    manifestInput: unknown
    styleDefinitions?: unknown[]
  }
  const preset = compiler.compileDefaultPresetManifest({
    manifestInput: presetDirectives.manifestInput,
    styleDefinitions: presetDirectives.styleDefinitions || []
  }) as { json: string }
  expect(preset.json).toBe(await readFile(new URL(
    '../../preset/src/default-manifest.json',
    import.meta.url
  ), 'utf8'))
})
