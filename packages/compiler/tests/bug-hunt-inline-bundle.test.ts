import { expect, test } from 'vitest'
import { createCompiler } from '../src/index'

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding} bundle rendering can inline leaves while preserving asset boundaries`, async () => {
    using compiler = await createCompiler({ binding })
    const slotCSSRule = '#slot{--slot:0}'
    const bundle = compiler.prepareStylesheetBundle({ source: slotCSSRule, from: 'bundle', slotCSSRule, managed: { entry: 'root', stylesheets: [
      { id: 'root', href: '/root.css', css: '@import "/child.css" layer(shared) print;' },
      { id: 'child', href: '/child.css', css: '.example{color:blue}' }
    ] } })
    const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, i) => [node.id, `/out/${i}.css`]))
    expect(compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true }).find(a => a.id === 'bundle')?.css).toContain('@import')
    const assets = compiler.renderStylesheetBundle({ bundle: JSON.parse(JSON.stringify(bundle)), urls, preserveResourceBase: true, inlineImports: true })
    const entry = assets.find(a => a.id === 'bundle')!
    expect(entry.css).not.toContain('@import')
    expect(entry.css).toContain('@media print')
    expect(entry.css).toContain('@layer shared')
    expect(entry.css).toContain('color:blue')
    expect(Object.isFrozen(assets)).toBe(true)
    expect(Object.isFrozen(entry)).toBe(true)
  })
}
