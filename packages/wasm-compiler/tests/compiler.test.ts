import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'
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

test('loads the isolated compiler Wasm surface', async () => {
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_wasm_compiler_bg.wasm',
    import.meta.url
  )))
  const compiler = await initCompilerWasm({ input })
  expect(compiler.inspectCSS('@master entry;')).toEqual({
    hasMasterEntryDirective: true,
    hasMasterCSSImport: false,
    hasMasterEntry: true
  })
  expect(compiler.compileNativeCSS('@master entry;\n.card { color: red; }')).toMatchObject({
    css: '.card {\n  color: red;\n}',
    nativeCSS: '.card {\n  color: red;\n}'
  })
  expect(compiler.compileCSSDirectives('@theme dark static { --color-brand: #fff; }')).toMatchObject({
    manifestInput: {
      modes: ['dark'],
      variables: [{ name: 'color-brand', value: '#fff', mode: 'dark', static: true }]
    },
    nativeCSS: ''
  })
  expect(toPlainValue(compiler.compileManifestInput({
    variables: [{ name: 'color-brand', value: '#fff' }],
    utilities: [{ name: 'card', declarations: { color: 'red' } }]
  }))).toEqual({
    manifest: {
      version: 1,
      variables: {
        color: [{
          name: 'color-brand',
          key: 'brand',
          type: 'string',
          value: '#fff'
        }]
      },
      utilities: [{
        id: '.card',
        name: 'card',
        type: -2,
        order: 0,
        layer: 'utilities',
        matchers: [{ type: 'static', name: 'card' }],
        emit: {
          type: 'static',
          rules: [{ declarations: { color: 'red' } }]
        }
      }]
    }
  })
  expect(compiler.resolveCSSImportGraph({
    entry: '/entry.css',
    files: {
      '/entry.css': '@import "./theme.css";.entry{display:block}',
      '/theme.css': '@theme{--color-brand:red}'
    },
    edges: [{ from: '/entry.css', specifier: './theme.css', resolved: '/theme.css' }]
  })).toEqual({
    source: '@theme{--color-brand:red}.entry{display:block}',
    dependencies: ['/entry.css', '/theme.css']
  })

  const presetSources = await Promise.all(['base.css', 'theme.css', 'variants.css', 'utilities.css']
    .map((file) => readFile(new URL(`../../preset/src/${file}`, import.meta.url), 'utf8')))
  const presetDirectives = compiler.compileCSSDirectives(presetSources.join('\n')) as {
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
