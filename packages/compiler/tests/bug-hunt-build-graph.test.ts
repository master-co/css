import { mkdtempSync, rmSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createCompiler, type MasterCSSStylesheetBundle } from '../src/index'
import { resolveStylesheetSync } from '../src/stylesheet/public'
import { prepareCSSImportGraph } from '../src/node-imports'
import { analyzeCSSDependencies } from '../src/node-compiler'

test('BH-0004 graph classification preserves a qualified external import and its original source', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-build-classification-'))
  try {
    const file = join(root, 'entry.css'), child = join(root, 'child.css')
    const source = "@import './child.css' layer(shared);@master entry;"
    writeFileSync(child, "@import 'https://remote.test/style.css';.example{color:red}")
    expect(() => resolveStylesheetSync(file, source)).toThrow()
    const result = resolveStylesheetSync(file, source, { preserveImports: true })
    expect(result).toMatchObject({ kind: 'entry', source, compilationSource: source })
    expect(result?.dependencies).toEqual([file, child])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('BH-0004 Node package CSS resolution preserves ownership and is explicitly selected', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-build-package-'))
  try {
    const dir = join(root, 'node_modules/paint-package')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'paint-package', exports: './entry.css' }))
    writeFileSync(join(dir, 'entry.css'), '@import "./nested.css";.package{color:red}')
    writeFileSync(join(dir, 'nested.css'), '.nested{color:blue}')
    const source = '@import "paint-package" layer;'
    const file = join(root, 'virtual-entry.css')
    expect(prepareCSSImportGraph(file, source, {}, analyzeCSSDependencies).edges).toEqual([])
    const graph = prepareCSSImportGraph(file, source, { resolveNodePackageImports: true }, analyzeCSSDependencies)
    expect(graph.edges).toHaveLength(2)
    expect(graph.packageFiles).toEqual([realpathSync(join(dir, 'entry.css')), realpathSync(join(dir, 'nested.css'))])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding} preserves an explicitly shared resource base and rejects conflicting relocation`, async () => {
    using compiler = await createCompiler({ binding })
    const bundle: MasterCSSStylesheetBundle = compiler.prepareStylesheetBundle({ source: '.example{background:url(image.svg)}#slot{--slot:0}', from: 'bundle', slotCSSRule: '#slot{--slot:0}', managed: { entry: 'managed', stylesheets: [{ id: 'managed', href: './managed.css', css: '.example{color:red}' }] } })
    const urls = Object.fromEntries(bundle.graph.stylesheets.map((s, i) => [s.id, `./${i}.css`]))
    expect(() => compiler.renderStylesheetBundle({ bundle, urls })).toThrow(/Missing resource URL/)
    const assets = compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true })
    expect(assets.some(a => a.css.includes('url(image.svg)'))).toBe(true)
    expect(() => compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true, resourceURLs: { 'image.svg': '/images/image.svg' } })).toThrow(/cannot also relocate/)
  })
}
