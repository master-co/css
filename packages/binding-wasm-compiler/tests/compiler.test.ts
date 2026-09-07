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
  expect(compiler.inspectCSS('@master entry;')).toEqual({
    hasMasterEntryDirective: true,
    hasMasterCSSImport: false,
    hasMasterEntry: true,
    directives: [{
      name: 'master',
      range: { start: 0, end: 14 },
      preludeRange: { start: 7, end: 13 },
      hasBlock: false,
      quotedStrings: 0
    }]
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
  expect(toPlainValue(compiler.compileManifestInput({
    utilities: [{
      name: 'text-<size>',
      type: 'pattern',
      pattern: { prefix: 'text-', values: ['sm'] },
      declarations: {
        'font-size': '--value()',
        'line-height': 'calc(--value() * 1.5)'
      }
    }]
  }))).toMatchObject({
    manifest: {
      utilities: [{
        emit: {
          rules: [{
            declarations: {
              'font-size': null,
              'line-height': ['calc(', null, ' * 1.5)']
            }
          }]
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
  expect(compiler.filterCSSExtractionCandidates(
    ['bg:red', 'fg:red'],
    [{ source: '^bg:', flags: 'g' }]
  )).toEqual(['fg:red'])

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
