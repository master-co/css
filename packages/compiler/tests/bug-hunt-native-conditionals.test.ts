import { expect, test } from 'vitest'
import { SourceMap } from 'node:module'
import { createCompiler } from '../src/index'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

const baseManifest = { version: 1 as const, utilities: [] }
const wrappers = ['@media(min-width:1px)', '@supports(display:grid)', '@container card (min-width:1px)', '@layer cards', '@layer', '@starting-style']

test('BH-0057 native and Wasm graphs preserve conditional structure and sibling order', async () => {
  using native = await createCompiler({ binding: 'native' })
  using wasm = await createCompiler({ binding: 'wasm' })
  for (const wrapper of wrappers) {
    const source = `@utilities{paint{padding:2rem}}${wrapper}{.card{@compose paint;}.card{padding:3rem}}`
    const request = { graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] }, urls: { '/entry.css': '/entry.css' }, baseManifest }
    const output = native.compileStylesheets(request)
    expect(wasm.compileStylesheets(request)).toEqual(output)
    const css = output.stylesheets[0].css.replace(/\s+/g, '')
    expect(css).not.toContain('@compose')
    expect(css.indexOf('padding:2rem')).toBeLessThan(css.indexOf('padding:3rem'))
    expect(css.match(/@(media|supports|container|layer|starting-style)/g)).toHaveLength(1)
    const nestedRequest = { ...request, graph: { ...request.graph, files: { '/entry.css': `@utilities{paint{padding:2rem}}.card{${wrapper}{@compose paint;}}` } } }
    const nested = native.compileStylesheets(nestedRequest)
    expect(wasm.compileStylesheets(nestedRequest)).toEqual(nested)
    expect(nested.stylesheets[0].css).toContain('padding:2rem')
    expect(nested.stylesheets[0].css).not.toContain('@compose')
  }
})

test('BH-0057 public direct output maps conditional compose to authored selector and class', async () => {
  for (const wrapper of wrappers) {
    const source = `/* 😀 */\n@utilities{paint{padding:2rem}}\n${wrapper}{\n.card{@compose paint;}\n}`
    const result = await compileRenderedStylesheet('/entry.css', source, { baseManifest, preserveNativeCSS: true })
    expect(result.css).not.toContain('@compose')
    expect(result.css).toContain('padding:2rem')
    const map = new SourceMap(JSON.parse(result.sourceMap!))
    for (const [generated, originalColumn] of [['.card', 0], ['padding:2rem', 15]] as const) {
      const before = result.css.slice(0, result.css.indexOf(generated)).split('\n')
      expect(map.findEntry(before.length - 1, before.at(-1)!.length)).toMatchObject({ originalLine: 3, originalColumn })
    }
  }
})

test('BH-0057 direct public stylesheet keeps the authored winner inside native media', async () => {
  const source = '@utilities{paint{padding:2rem}}@media(min-width:1px){.card{@compose paint;}.card{padding:3rem}}'
  const result = await compileRenderedStylesheet('/entry.css', source, { baseManifest, preserveNativeCSS: true })
  const css = result.css.replace(/\s+/g, '')
  expect(css.indexOf('padding:2rem')).toBeLessThan(css.indexOf('padding:3rem'))
})
