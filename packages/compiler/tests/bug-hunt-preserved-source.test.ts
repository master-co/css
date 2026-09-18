import { expect, test } from 'vitest'
import { SourceMap } from 'node:module'
import { createCompiler } from '../src/index'
import { compileStylesheet } from '../src/stylesheet/index-public'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'

const baseManifest = { version: 1 as const, utilities: [] }
const native = '/* 🧪 audit */.empty{}.shared{margin:0px 0px 0px 0px}.sibling{margin:0px 0px 0px 0px}'
const source = '@theme{--color-unused:red}' + native

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding} source preservation is explicit and rejects class pruning`, async () => {
    using compiler = await createCompiler({ binding })
    expect(compiler.compileCSS(source).nativeCSS).not.toContain('.empty{}')
    const options = { baseManifest, from: '/project/entry.css', preserveNativeSource: true }
    expect(compiler.compileCSS(source, options).nativeCSS).toBe(native)
    expect(compiler.compileManifest(source, options).css).toBe(native)
    expect(() => compiler.compileCSS(source, { ...options, classes: [] }))
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
    expect(compiler.compileStylesheets(request).css).toBe(native)
    expect(() => compiler.compileStylesheets({ ...request, classesByStylesheet: { entry: [] } }))
      .toThrow('cannot be combined with class pruning')
  })
}

test('Node stylesheet preparation preserves raw text and exact UTF-16 selector origins', async () => {
  const result = await compileStylesheet('/project/entry.css', source, { baseManifest, preserveNativeSource: true })
  expect(result.css).toBe(native)
  const payload = JSON.parse(result.sourceMap!)
  const map = new SourceMap(payload)
  for (const selector of ['.empty', '.shared', '.sibling']) {
    expect(map.findEntry(0, result.css.indexOf(selector))).toMatchObject({
      originalSource: 'file:///project/entry.css', originalLine: 0, originalColumn: source.indexOf(selector)
    })
  }
  expect(payload.sourcesContent).toContain(source)
})

test('Wasm stylesheet preparation retains untouched bytes', async () => {
  const result = await compileBrowserStylesheet(source, { baseManifest, preserveNativeSource: true })
  expect(result.nativeCSS).toBe(native)
  expect(result.css).toBe(native)
})
