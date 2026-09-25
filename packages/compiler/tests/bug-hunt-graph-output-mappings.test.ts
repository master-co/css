import { expect, test } from 'vitest'
import { createCompiler } from '../src/index'
import type { MasterCSSCompileStylesheetsRequest } from '../src/index'

const entry = '@import "./child.css" layer;@utilities{paint{padding:2rem}}/* 😀 */\n.after{margin:1px}'
const child = '.image{background:url("./dot.svg")}/* 😀 */\n@layer{.card{@compose paint;}.card{padding:3rem}}'
const request: MasterCSSCompileStylesheetsRequest = {
  graph: { entry: '/entry.css', files: { '/entry.css': entry, '/child.css': child }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] },
  urls: { '/entry.css': '/entry.css', '/child.css': '/assets/very-long-child-😀.css?version=abcdef' },
  resourceURLs: { '/child.css': { './dot.svg': 'https://cdn.test/very-long-resource.svg' } },
  baseManifest: { version: 1, languageVersion: 3, utilities: [] }
}

test('graph output mappings retain original anchors across import, resource and compose output', async () => {
  using native = await createCompiler({ binding: 'native' })
  using wasm = await createCompiler({ binding: 'wasm' })
  const result = native.compileStylesheets(request)
  expect(wasm.compileStylesheets(JSON.parse(JSON.stringify(request)))).toEqual(result)
  for (const [id, source, needles] of [['/entry.css', entry, ['.after']], ['/child.css', child, ['.card', 'padding:2rem']]] as const) {
    const sheet = result.stylesheets.find(sheet => sheet.id === id)!
    for (const needle of needles) {
      const map = sheet.outputMappings.find(mapping => mapping.generatedStart === sheet.css.indexOf(needle))
      expect(map?.source).toMatchObject({ file: id, range: { start: source.indexOf(needle === 'padding:2rem' ? 'paint;' : needle) } })
    }
  }
})

for (const binding of ['native', 'wasm'] as const) {
  test(`graph ${binding} preserves quoted compose marker text and renders the actual rule`, async () => {
    using compiler = await createCompiler({ binding })
    const source = '@utilities{paint{padding:2rem}}.label::before{content:"@--master-css-compose-slot-0;"}.card{@compose paint;}'
    const result = compiler.compileStylesheets({ graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] }, urls: { '/entry.css': '/entry.css' }, baseManifest: { version: 1, languageVersion: 3, utilities: [] } })
    expect(result.css).toContain('content: "@--master-css-compose-slot-0;"')
    expect(result.css).toContain('.card{padding:2rem}')
    const sheet = result.stylesheets[0]
    expect(sheet.outputMappings.find(mapping => mapping.generatedStart === sheet.css.indexOf('.card'))?.source.range.start).toBe(source.indexOf('.card'))
  })
}

for (const binding of ['native', 'wasm'] as const) {
  test(`graph ${binding} native suppression preserves composed conditions and their source anchors`, async () => {
    using compiler = await createCompiler({ binding })
    const source = '@utilities{paint{padding:2rem}}.plain{margin:1px}@media print{@layer{.card{@compose paint;}.other{@compose paint;}}}'
    const result = compiler.compileStylesheets({ graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] }, urls: { '/entry.css': '/entry.css' }, baseManifest: { version: 1, languageVersion: 3, utilities: [] }, options: { preserveNativeCSS: false } })
    expect(result.css).toContain('@media print')
    expect(result.css.match(/@layer/g)).toHaveLength(1)
    expect(result.css).not.toContain('.plain')
    const sheet = result.stylesheets[0]
    expect(sheet.outputMappings.find(mapping => mapping.generatedStart === sheet.css.indexOf('.card'))?.source.range.start).toBe(source.indexOf('.card'))
  })
}
