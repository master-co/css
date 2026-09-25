import { expect, test } from 'vitest'
import { MasterCSSError } from '@master/css-schema'
import { createCompiler, type MasterCSSPrepareStylesheetBundleRequest } from '../src/index'
import { createCompilerSync } from '../src/node'

const slotCSSRule = '#master-css-slot{--slot:0}'
const source = `/*🦀*/@namespace svg 'http://www.w3.org/2000/svg';svg|a{fill:red}${slotCSSRule}svg|a{fill-blue;background-image:url(image.svg?q=1#part)}`

test('BH-0004 native/Wasm bundle transport reconnects compiled imports and relocates original references', async () => {
  using native = await createCompiler({ binding: 'native' })
  using wasm = await createCompiler({ binding: 'wasm' })
  const managed = native.compileStylesheets({
    graph: { entry: 'entry', files: { entry: "@import './child.css' layer;", child: "@import 'https://remote.test/native.css';.example{color:blue}" }, edges: [{ from: 'entry', specifier: './child.css', resolved: 'child' }] },
    urls: { entry: '/old/entry.css', child: '/old/child.css' },
    baseManifest: { version: 1, languageVersion: 3, utilities: [] }
  })
  const request = { source, from: 'bundle.css', slotCSSRule, managed }
  const bundle = native.prepareStylesheetBundle(request)
  expect(wasm.prepareStylesheetBundle(request)).toEqual(bundle)
  expect(bundle.slots).toBe(1)
  expect(bundle.graph.stylesheets.find(s => s.id === 'entry')?.imports[0].resolved).toBe('child')
  const resource = bundle.sources.flatMap(s => s.resources)[0]
  expect(source.slice(resource.start, resource.end)).toBe('url(image.svg?q=1#part)')
  const renderRequest = {
    bundle: JSON.parse(JSON.stringify(bundle)),
    urls: Object.fromEntries(bundle.graph.stylesheets.map((s, i) => [s.id, `/new/${i}.css`])),
    resourceURLs: { 'image.svg?q=1#part': '/original/image.svg?q=1#part' }
  }
  const assets = native.renderStylesheetBundle(renderRequest)
  expect(wasm.renderStylesheetBundle(renderRequest)).toEqual(assets)
  expect(assets.find(a => a.id === 'entry')?.css).toContain(renderRequest.urls.child)
  expect(assets.find(a => a.id === 'child')?.css).toContain('https://remote.test/native.css')
  expect(assets.some(a => a.css.includes('/original/image.svg?q=1#part'))).toBe(true)
  expect(Object.isFrozen(bundle.graph.stylesheets)).toBe(true)
  expect(Object.isFrozen(bundle.sources[0].range)).toBe(true)
  expect(Object.isFrozen(bundle.sources.at(-1)?.resources[0])).toBe(true)
  expect(Object.isFrozen(assets[0])).toBe(true)
})

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding} bundle errors retain original source and disposed guards`, async () => {
    const compiler = await createCompiler({ binding })
    const managed = { entry: 'managed', stylesheets: [{ id: 'managed', href: '/managed.css', css: '.example{color:red}' }] }
    const request: MasterCSSPrepareStylesheetBundleRequest = { source: `/*🦀*/\n@container (width>1px){${slotCSSRule}}`, from: 'bundle.css', slotCSSRule, managed }
    try {
      expect(() => compiler.prepareStylesheetBundle(request)).toThrowError(expect.objectContaining({ code: 'CSS_PARSE_ERROR' }))
      try { compiler.prepareStylesheetBundle(request) } catch (error) {
        expect(error).toBeInstanceOf(MasterCSSError)
        expect((error as MasterCSSError).diagnostics[0]).toMatchObject({ source: 'bundle.css', range: { start: { line: 1, character: 0 } } })
      }
      const valid = { ...request, source: slotCSSRule }
      const bundle = compiler.prepareStylesheetBundle(valid)
      expect(() => compiler.renderStylesheetBundle({ bundle, urls: {} })).toThrowError(expect.objectContaining({ code: 'CSS_IMPORT_ERROR' }))
      expect(() => compiler.prepareStylesheetBundle({ ...valid, managed: { ...managed, stylesheets: [...managed.stylesheets, { id: 'other', href: '/managed.css', css: '' }] } })).toThrow(/distinct nonempty/)
      compiler.dispose()
      expect(() => compiler.prepareStylesheetBundle(valid)).toThrowError(expect.objectContaining({ code: 'SESSION_DISPOSED' }))
      expect(() => compiler.renderStylesheetBundle({ bundle, urls: {} })).toThrowError(expect.objectContaining({ code: 'SESSION_DISPOSED' }))
    } finally { compiler.dispose() }
  })
}

test('BH-0004 sync compiler exposes the same two-phase bundle API', async () => {
  using sync = createCompilerSync()
  using asyncCompiler = await createCompiler({ binding: 'native' })
  const request = { source: slotCSSRule, from: 'bundle.css', slotCSSRule, managed: { entry: 'managed', stylesheets: [{ id: 'managed', href: '/managed.css', css: '.example{color:red}' }] } }
  expect(sync.prepareStylesheetBundle(request)).toEqual(asyncCompiler.prepareStylesheetBundle(request))
})
