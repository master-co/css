import { expect, test } from 'vitest'
import { createCompiler, type MasterCSSCompileStylesheetsRequest } from '../src/index'
import { createCompilerBindingSession } from '../src/session'

const request: MasterCSSCompileStylesheetsRequest = {
  graph: { entry: 'entry', files: {
    entry: "@import './child.css';.example{@compose paint;}",
    child: '@utilities{paint{background:url(hero.svg?q=1#part)}}.native{background:image-set("small.png" 1x,url(big.png) 2x)}'
  }, edges: [{ from: 'entry', specifier: './child.css', resolved: 'child' }] },
  urls: { entry: '/output/main.css', child: '/output/child.css' },
  resourceURLs: { child: { 'hero.svg?q=1#part': '/source/child/hero.svg?q=1#part', 'small.png': '/source/child/small.png', 'big.png': '/source/child/big.png' } },
  baseManifest: { version: 1, utilities: [] }
}

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding}: original-source resource discovery includes authoring and image-set`, async () => {
    const session = await createCompilerBindingSession({ binding })
    try {
      const source = '/*😀*/@reference "ref.css";@namespace x url(uri);@utilities{paint{background:u\\72l("a.png")}}.x{background:image-set("b.png" 1x,url(c.png) 2x);filter:url(#local)}'
      const analysis = session.analyzeCSSDependencies(source)
      expect(analysis.resources.map(item => item.url)).toEqual(['a.png', 'b.png', 'c.png'])
      expect(analysis.resources.map(item => source.slice(item.start, item.end))).toEqual(['u\\72l("a.png")', 'image-set("b.png" 1x,url(c.png) 2x)', 'image-set("b.png" 1x,url(c.png) 2x)'])
    } finally { session.dispose() }
  })

  test(`BH-0004 ${binding}: relocation retains definition origin across files`, async () => {
    using compiler = await createCompiler({ binding })
    const result = compiler.compileStylesheets(request)
    expect(result.stylesheets[0].generatedCSS).toContain('/source/child/hero.svg?q=1#part')
    expect(result.stylesheets[1].css).toContain('/source/child/small.png')
    expect(result.stylesheets[1].css).toContain('/source/child/big.png')
    expect(JSON.stringify(result.manifest)).toContain('/source/child/hero.svg?q=1#part')
    expect(() => compiler.compileStylesheets({ ...request, resourceURLs: {} })).toThrowError(expect.objectContaining({ code: 'CSS_IMPORT_ERROR' }))
    expect(() => compiler.compileStylesheets({ ...request, resourceURLs: { child: { 'hero.svg?q=1#part': '../still-relative.svg' } } })).toThrowError(/root-relative or absolute/)
  })
}
