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
  const theme = [{ type: 'rule' as const, prelude: ':root,:host', children: [
    { type: 'declaration' as const, name: 'color-brand', value: '#fff' }
  ] }]
  expect(compiler.compileCSSDirectives(`@theme {
  --color-brand: #fff;
}

.dark { --color-brand: #fff; }
`)).toMatchObject({
    manifestInput: { theme }, nativeCSS: '.dark {\n  --color-brand: #fff;\n}'
  })
  expect(toPlainValue(compiler.compileManifestInput({
    theme,
    mixins: [
  {
    "name": "--card",
    "body": [
      {
        "type": "declaration" as const,
        "property": "color",
        "value": [
          {
            "type": "text" as const,
            "value": "red"
          }
        ]
      }
    ]
  }
]
  }))).toMatchObject({
    manifest: {
      version: 5 as const, languageVersion: 14 as const, theme,
      variables: { color: [{ name: 'color-brand', key: 'brand', values: [{ path: [':root,:host'], value: '#fff' }] }] },
      mixins: [
  {
    "name": "--card",
    "body": [{ type: "declaration", property: "color", value: [{ type: "text", value: "red" }] }]
  }
]
    }
  })
  const parameterMixin = {
    name: '--type-size', parameters: [{ name: '--size' }], body: [
      { type: 'declaration' as const, property: 'font-size', value: [{ type: 'function' as const, name: 'var', value: [{ type: 'text' as const, value: '--size' }] }] }
    ]
  }
  expect(toPlainValue(compiler.compileManifestInput({ mixins: [parameterMixin] })))
    .toMatchObject({ manifest: { mixins: [parameterMixin] } })
  // Match rather than equal: the graph also carries sourceMappings, whose
  // contents are the compiler crate's contract, not this surface check's.
  expect(compiler.resolveCSSImportGraph({
    entry: '/entry.css',
    files: {
      '/entry.css': '@import "./theme.css";.entry{display:block}',
      '/theme.css': `@theme {
  --color-brand:red;
}
`
    },
    edges: [{ from: '/entry.css', specifier: './theme.css', resolved: '/theme.css' }]
  })).toMatchObject({
    source: `@theme {
  --color-brand:red;
}
.entry{display:block}`,
    dependencies: ['/entry.css', '/theme.css']
  })
  expect(compiler.filterCSSExtractionCandidates(
    ['bg-red', 'fg-red'],
    [{ source: '^bg-', flags: 'g' }]
  )).toEqual(['fg-red'])

  const files = Object.fromEntries(await Promise.all(
    ['index.css', 'base.css', 'theme.css', 'colors.css', 'media.css', 'mixins.css']
      .map(async file => [`/${file}`, await readFile(new URL(`../../preset/src/${file}`, import.meta.url), 'utf8')])
  ))
  const graph = compiler.resolveCSSImportGraph({
    entry: '/index.css', files,
    edges: [
      ...['base.css', 'theme.css', 'media.css', 'mixins.css'].map(file => ({ from: '/index.css', specifier: `./${file}`, resolved: `/${file}` })),
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

test('static mixins decode parameter identifiers and CSS function names in Wasm', async () => {
  const input = new Uint8Array(await readFile(new URL('../artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)))
  const compiler = await initCompilerWasm({ input })
  const source = `@theme {
  --step-hero:2rem;
}@mixin --label(--step <string>){font-size:VAR(IDENT("--step-" VaR(--st\\65 p)))}.caption{@apply --label("hero")}`
  const result = toPlainValue(compiler.compileCSSStylesheetGraph({
    graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] },
    urls: { '/entry.css': '/out/entry.css' }
  })) as { manifest: unknown; stylesheets: { css: string }[] }
  expect(result.stylesheets).toHaveLength(1)
  const css = result.stylesheets[0].css
  expect(css).toMatch(/font-size:\s*VAR\(--step-hero\)/)
  const render = new compiler.CompilerRenderSession(JSON.stringify(result.manifest))
  try {
    render.ensureStylesheetResources(css)
    expect(toPlainValue(render.emittedGlobals())).toHaveProperty('variables.step-hero')
    expect(JSON.stringify(toPlainValue(render.snapshot()))).toContain('--step-hero:2rem')
  } finally {
    render.dispose()
    render.free()
  }
  expect(css).not.toContain('@apply')
  expect(() => compiler.compileCSSStylesheetGraph({
    graph: { entry: '/entry.css', files: { '/entry.css': '@mixin --x(--n){width:var(--n);height:var(--n)}.x{@apply --x(VAR(--external))}' }, edges: [] },
    urls: { '/entry.css': '/out/entry.css' }
  })).toThrow('must be static')
})
