import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { createCompiler, type MasterCSSCompileStylesheetsRequest } from '../src/index'

const cases = JSON.parse(readFileSync(new URL('../../../crates/mastercss-compiler/tests/bug_hunt_stylesheet_graph.json', import.meta.url), 'utf8')) as {
  id: string
  entry: string
  local?: string
}[]

for (const item of cases) {
  test(`BH-0004 compiled stylesheet boundaries: ${item.id}`, async () => {
    const request: MasterCSSCompileStylesheetsRequest = {
      graph: { entry: 'entry', files: { entry: item.entry, local: item.local || '.example{color:red}' }, edges: [{ from: 'entry', specifier: './local.css', resolved: 'local' }] },
      urls: { entry: '/output/entry.css', local: '/output/local.css' },
      baseManifest: { version: 1, languageVersion: 3, utilities: [] }
    }
    using native = await createCompiler({ binding: 'native' })
    using wasm = await createCompiler({ binding: 'wasm' })
    const actual = native.compileStylesheets(request)
    expect(wasm.compileStylesheets(request)).toEqual(actual)
    expect(actual.stylesheets).toHaveLength(2)
    expect(actual.css).toBe(actual.stylesheets[0].css)
    expect(actual.dependencies).toEqual(['entry', 'local'])
    expect(actual.stylesheets[0].css).toContain('/output/local.css')
    expect(Object.isFrozen(actual.stylesheets)).toBe(true)
    expect(Object.isFrozen(actual.stylesheets[0])).toBe(true)
  })
}

test('BH-0004 shared finalized manifest resolves child compose and revives extraction patterns', async () => {
  for (const binding of ['native', 'wasm'] as const) {
    using compiler = await createCompiler({ binding })
    const result = compiler.compileStylesheets({
      graph: { entry: 'entry', files: {
        entry: "@import './local.css' layer;@utilities{paint{color:red}}@blocklist 'unused*';",
        local: '.example{@compose paint;}'
      }, edges: [{ from: 'entry', specifier: './local.css', resolved: 'local' }] },
      urls: { entry: '/output/entry.css', local: '/output/local.css' },
      baseManifest: { version: 1, languageVersion: 3, utilities: [] }
    })
    expect(result.stylesheets[1].generatedCSS).toContain('color:red')
    expect(result.stylesheets[1].css).not.toContain('@compose')
    expect(result.directiveSummary.styleDefinitions).toBe(2)
    expect(result.directiveSummary.extractionPolicy.blocklist[0]).toBeInstanceOf(RegExp)
  }
})

test('BH-0004 graph compilation reports missing delivery URLs and disposed sessions', async () => {
  for (const binding of ['native', 'wasm'] as const) {
    const compiler = await createCompiler({ binding })
    const request = { graph: { entry: 'entry', files: { entry: '.x{color:red}' }, edges: [] }, urls: {} }
    try {
      expect(() => compiler.compileStylesheets(request)).toThrowError(expect.objectContaining({ code: 'CSS_IMPORT_ERROR' }))
    } finally { compiler.dispose() }
    expect(() => compiler.compileStylesheets(request)).toThrowError(expect.objectContaining({ code: 'SESSION_DISPOSED' }))
  }
})

test('BH-0004 reference context is explicit and is not merged into the emitted manifest', async () => {
  for (const binding of ['native', 'wasm'] as const) {
    using compiler = await createCompiler({ binding })
    const request: MasterCSSCompileStylesheetsRequest = {
      graph: { entry: 'entry', files: { entry: "@reference 'reference.css';.example{@compose paint;}" }, edges: [] },
      urls: { entry: '/entry.css' }, baseManifest: { version: 1, languageVersion: 3, utilities: [] }
    }
    expect(() => compiler.compileStylesheets(request)).toThrowError(expect.objectContaining({ code: 'CSS_IMPORT_ERROR' }))
    const reference = compiler.compileManifest('@utilities{paint{color:red}}', { baseManifest: { version: 1, languageVersion: 3, utilities: [] } })
    const result = compiler.compileStylesheets({ ...request, resolutionManifest: reference.manifest })
    expect(result.css).toContain('color:red')
    const empty = compiler.compileManifest('', { baseManifest: { version: 1, languageVersion: 3, utilities: [] } })
    expect(result.manifest).toEqual(empty.manifest)
  }
})


test('BH-0004 native/Wasm agree on explicitly scoped sibling resource delivery', async () => {
  const request: MasterCSSCompileStylesheetsRequest = {
    graph: { entry: 'entry', files: {
      entry: "@import './child.css';.example{@compose paint;}",
      child: '@utilities{paint{background-image:url(image.svg)}}.unscanned{color:blue}'
    }, edges: [{ from: 'entry', specifier: './child.css', resolved: 'child' }] },
    urls: { entry: './entry.css', child: './child.css' },
    resourceURLs: { child: { 'image.svg': './asset.svg?q=1#part' } },
    relativeResourceURLs: true, options: { classes: ['example'] }, classesByStylesheet: { child: null }, baseManifest: { version: 1, languageVersion: 3, utilities: [] }
  }
  using native = await createCompiler({ binding: 'native' })
  using wasm = await createCompiler({ binding: 'wasm' })
  expect(wasm.compileStylesheets(request)).toEqual(native.compileStylesheets(request))
  expect(native.compileStylesheets(request).css).toContain('./asset.svg?q=1#part')
  expect(native.compileStylesheets(request).stylesheets[1].css).toContain('.unscanned')
  for (const compiler of [native, wasm]) {
    expect(() => compiler.compileStylesheets({ ...request, urls: { ...request.urls, child: './nested/child.css' } })).toThrow(/sibling stylesheet/)
  }
})
