import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { createCompilerBindingSession } from '../src/compiler-binding'

async function session(binding: 'native' | 'wasm') {
  if (binding === 'native') return createCompilerBindingSession({ binding })
  const directory = process.env.BH_COMPILER_WASM_DIR
    ?? fileURLToPath(new URL('../../binding-wasm-compiler/artifacts/', import.meta.url))
  return createCompilerBindingSession({ binding, wasm: {
    module: await import(pathToFileURL(join(directory, 'mastercss_binding_wasm_compiler.js')).href),
    input: readFileSync(join(directory, 'mastercss_binding_wasm_compiler_bg.wasm'))
  } })
}

test('BH-0004 native/Wasm discovery retains file boundaries, occurrences and UTF-16 import spans', async () => {
  const native = await session('native'), wasm = await session('wasm')
  try {
    for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' screen', ' layer(cards) supports(display:grid) screen']) {
      const entry = `/*😀*/@import './child.css'${qualifier};@import './child.css'${qualifier};@source './root/*.html';`
      const child = "@import 'https://invalid.invalid/external.css';@reference './missing.css';@source './child/*.html';@utilities{broken{@compose undefined;}}.native{unknown:???}"
      const request = { entry: '/entry.css', files: { '/entry.css': entry, '/child.css': child }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] }
      const a = native.resolveCSSStylesheetGraph(request), b = wasm.resolveCSSStylesheetGraph(request)
      expect(b).toEqual(a)
      expect(a.stylesheets.map(node => node.id)).toEqual(['/entry.css', '/child.css'])
      expect(a.stylesheets[0].imports).toHaveLength(2)
      for (const edge of a.stylesheets[0].imports) {
        expect(entry.slice(edge.start, edge.end)).toBe(edge.statement)
        expect(edge.statement).toContain(qualifier + ';')
        expect(edge.resolved).toBe('/child.css')
      }
      expect(a.stylesheets[1].source).toContain('@source')
      expect(a.stylesheets[1].source).toContain('@compose undefined')
      expect(a.stylesheets[1].imports[0].resolved).toBeNull()
      expect(a.references).toMatchObject([{ source: './missing.css', file: '/child.css' }])
    }
  } finally { native.dispose(); wasm.dispose() }
})

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding} discovery rejects cycles`, async () => {
    const compiler = await session(binding)
    try {
      expect(() => compiler.resolveCSSStylesheetGraph({
        entry: '/a.css', files: { '/a.css': "@import './b.css';", '/b.css': "@import './a.css';" },
        edges: [{ from: '/a.css', specifier: './b.css', resolved: '/b.css' }, { from: '/b.css', specifier: './a.css', resolved: '/a.css' }]
      })).toThrow('Circular CSS import')
    } finally { compiler.dispose() }
  })
  test(`BH-0004 ${binding} discovery validates import syntax`, async () => {
    const compiler = await session(binding)
    try {
      expect(() => compiler.resolveCSSStylesheetGraph({ entry: '/bad.css', files: { '/bad.css': '@import not-a-url;' }, edges: [] })).toThrow()
    } finally { compiler.dispose() }
  })
  test(`BH-0004 ${binding} discovery respects disposal`, async () => {
    const compiler = await session(binding)
    compiler.dispose()
    expect(() => compiler.resolveCSSStylesheetGraph({ entry: '/a.css', files: { '/a.css': '' }, edges: [] })).toThrow('disposed')
  })
}
