import { expect, test } from 'vitest'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SourceMap } from 'node:module'
import { createCompiler } from '../src/index'
import { compileStylesheet } from '../src/stylesheet/index-public'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'

const baseManifest = { variants: [{ token: '@all' as const, branches: [{ conditions: ['@media all'] }] }], version: 2 as const, languageVersion: 4 as const, utilities: [] }
const native = '/* 🧪 audit */.empty{}.shared{margin:0px 0px 0px 0px}.sibling{margin:0px 0px 0px 0px}'
const source = "@theme {:root, :host {--color-unused:red}}\n\n" + native

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding} source preservation allows class lists and rejects explicit pruning`, async () => {
    using compiler = await createCompiler({ binding })
    expect(compiler.compileCSS(source).nativeCSS).not.toContain('.empty{}')
    const options = { baseManifest, from: '/project/entry.css', preserveNativeSource: true }
    expect(compiler.compileCSS(source, options).nativeCSS).toBe('\n\n' + native)
    expect(compiler.compileManifest(source, options).css).toBe('\n\n' + native)
    expect(compiler.compileCSS(source, { ...options, classes: [] }).nativeCSS).toBe('\n\n' + native)
    expect(() => compiler.compileCSS(source, { ...options, classes: [], pruneNativeCSS: true }))
      .toThrow('cannot be combined with class pruning')
    expect(compiler.compileCSS(source, { ...options, preserveNativeCSS: false }).nativeCSS).toBe('')
  })
  test(`${binding} graph preparation preserves native input and rejects per-file pruning`, async () => {
    using compiler = await createCompiler({ binding })
    const request = {
      graph: { entry: 'entry', files: { entry: source }, edges: [] },
      urls: { entry: '/output/entry.css' }, baseManifest,
      options: { preserveNativeSource: true }
    }
    expect(compiler.compileStylesheets(request).css).toBe('\n\n' + native)
    expect(compiler.compileStylesheets({ ...request, classesByStylesheet: { entry: [] } }).css).toBe('\n\n' + native)
    expect(() => compiler.compileStylesheets({ ...request, options: { ...request.options, pruneNativeCSS: true }, classesByStylesheet: { entry: [] } }))
      .toThrow('cannot be combined with class pruning')
  })
}

test('Node stylesheet preparation preserves raw text and exact UTF-16 selector origins', async () => {
  const file = resolve('/project/entry.css')
  const result = await compileStylesheet(file, source, { baseManifest, preserveNativeSource: true })
  expect(result.css).toBe('\n\n' + native)
  const payload = JSON.parse(result.sourceMap!)
  const map = new SourceMap(payload)
  for (const selector of ['.empty', '.shared', '.sibling']) {
    expect(map.findEntry(2, native.indexOf(selector))).toMatchObject({
      originalSource: pathToFileURL(file).href, originalLine: 2, originalColumn: native.indexOf(selector)
    })
  }
  expect(payload.sourcesContent).toContain(source)
})

test('Wasm stylesheet preparation retains untouched bytes', async () => {
  const result = await compileBrowserStylesheet(source, { baseManifest, preserveNativeSource: true })
  expect(result.nativeCSS).toBe('\n\n' + native)
  expect(result.css).toBe('\n\n' + native)
})
