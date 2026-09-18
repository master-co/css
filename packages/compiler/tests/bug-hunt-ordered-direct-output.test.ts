import { expect, test } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SourceMap } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createCompiler } from '../src/index'
import { createCompilerBindingSession } from '../src/session'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

const baseManifest = { version: 1 as const, utilities: [] }
const source = '@utilities{paint{padding:2rem}}@layer{.card{@compose paint;}.card{padding:3rem!important}}'

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0057 ${binding} universal direct output preserves a single anonymous layer and order`, async () => {
    using compiler = await createCompiler({ binding })
    const result = compiler.compileManifest(source, { from: '/entry.css', baseManifest, preserveNativeCSS: true })
    const css = result.css.replace(/\s+/g, '')
    expect(css.match(/@layer/g)).toHaveLength(1)
    expect(css.indexOf('padding:2rem')).toBeLessThan(css.indexOf('padding:3rem!important'))
    expect(css).not.toContain('@--master-css-compose-slot-')
  })
}

test('ordered output and mappings survive a native/Wasm JSON round trip, including invalid-slot errors', async () => {
  const native = await createCompilerBindingSession({ binding: 'native' })
  const wasm = await createCompilerBindingSession({ binding: 'wasm' })
  try {
    const parsed = native.compileCSS(source, { from: '/entry.css' })
    expect(wasm.compileCSS(source, { from: '/entry.css' })).toEqual(parsed)
    const request = JSON.parse(JSON.stringify({ manifestInput: parsed.manifestInput, styleDefinitions: parsed.styleDefinitions, nativeOutput: parsed.nativeOutput }))
    const result = native.lowerCSSDirectives(request, { baseManifest })
    expect(wasm.lowerCSSDirectives(request, { baseManifest })).toEqual(result)
    expect(result.outputMappings?.some(mapping => mapping.source.range.start === source.indexOf('.card'))).toBe(true)
    request.nativeOutput.slots[0].end = 4294967295
    for (const compiler of [native, wasm]) expect(() => compiler.lowerCSSDirectives(request, { baseManifest })).toThrowError(expect.objectContaining({ code: 'CSS_DIRECTIVE_ERROR' }))
  } finally { native.dispose(); wasm.dispose() }
})

test('BH-0004 qualified imports with child managed definitions preserve output and source maps', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-ordered-map-'))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css')
    const childSource = '@utilities{paint{padding:2rem}}\n.card{@compose paint;}\n.card{padding:3rem}'
    writeFileSync(child, childSource)
    const text = '@import "./child.css" layer;\n.after{margin:1px}'
    const result = await compileRenderedStylesheet(entry, text, { baseManifest, projectDir: root, preserveNativeCSS: true })
    expect(result.css.match(/@layer/g)).toHaveLength(1)
    const map = new SourceMap(JSON.parse(result.sourceMap!))
    for (const [selector, file, line] of [['.card', child, 1], ['.after', entry, 1]] as const) {
      const prefix = result.css.slice(0, result.css.indexOf(selector)).split('\n')
      expect(map.findEntry(prefix.length - 1, prefix.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: line, originalColumn: 0 })
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('ordered native-only imported layers retain child and later root mappings', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-ordered-map-'))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css')
    const childSource = '/* child */\n.card{@compose paint;}\n.card{padding:3rem}'
    writeFileSync(child, childSource)
    const text = '@import "./child.css" layer;@utilities{paint{padding:2rem}}\n.after{margin:1px}'
    const result = await compileRenderedStylesheet(entry, text, { baseManifest, projectDir: root, preserveNativeCSS: true })
    expect(result.css.match(/@layer/g)).toHaveLength(1)
    const map = new SourceMap(JSON.parse(result.sourceMap!))
    for (const [selector, file, line] of [['.card', child, 1], ['.after', entry, 1]] as const) {
      const prefix = result.css.slice(0, result.css.indexOf(selector)).split('\n')
      expect(map.findEntry(prefix.length - 1, prefix.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: line, originalColumn: 0 })
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('disabling raw native CSS retains composed container context and accurate output maps', async () => {
  const source = '@utilities{paint{padding:2rem}}.plain{color:red}@supports(display:grid){.card{@compose paint;}}'
  const result = await compileRenderedStylesheet('/entry.css', source, { baseManifest, preserveNativeCSS: false })
  expect(result.css).not.toContain('.plain')
  expect(result.css).toContain('@supports')
  const prefix = result.css.slice(0, result.css.indexOf('.card')).split('\n')
  expect(new SourceMap(JSON.parse(result.sourceMap!)).findEntry(prefix.length - 1, prefix.at(-1)!.length)).toMatchObject({ originalLine: 0, originalColumn: source.indexOf('.card') })
})
