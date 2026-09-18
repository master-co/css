import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test, vi } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createStylesheetCollection, transformStylesheet } from '../src/stylesheet/public'
import { compileCSS } from '../src/node-compiler'
import { resolveReferenceOrigins } from '../src/stylesheet/reference-origins'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
const source = '/*😀*/\r\n@reference "./tokens.css";\r\n@reference "./tokens.css";\r\n.root{@compose paint-a paint-b;}'

for (const mapKind of ['relative', 'source-root', 'file-url']) for (const child of [false, true]) test.each(['transform', 'collection'])(`BH-0004 ${mapKind} maps preserve distinct partial references, child=${child}, %s`, async operation => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-reference-map-')))
  using collection = createStylesheetCollection()
  try {
    for (const side of ['a', 'b']) mkdirSync(join(root, 'origins', side), { recursive: true })
    const owner = join(root, 'style.scss'), originals = ['a', 'b'].map(side => join(root, 'origins', side, '_rules.scss'))
    const tokens = ['a', 'b'].map(side => join(root, 'origins', side, 'tokens.css'))
    writeFileSync(tokens[0], '@utilities{paint-a{padding:2rem}}.never-a{color:red}')
    writeFileSync(tokens[1], '@utilities{paint-b{margin:3rem}}.never-b{color:red}')
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint-a{padding:99rem}paint-b{margin:99rem}}')
    const sourceMap = JSON.stringify({ version: 3, file: owner, names: [],
      sourceRoot: mapKind === 'source-root' ? 'origins/' : '',
      sources: mapKind === 'file-url' ? originals.map(file => pathToFileURL(file).href) : ['a', 'b'].map(side => (mapKind === 'source-root' ? '' : 'origins/') + side + '/_rules.scss'),
      sourcesContent: ['@reference "./tokens.css";', '@reference "./tokens.css";'], mappings: ';AAAA;ACAA'
    })
    const id = '\0prepared:root.css', childID = '\0prepared:child.css'
    const delivery = { entryURL: '/entry.css', stylesheetURL: (file: string, variant?: string) => '/' + Buffer.from(variant ?? file).toString('hex') + '.css', resourceURL: (file: string) => file,
      ...(child ? { resolveImport: async () => ({ id: childID, source, baseFile: owner, sourceMap }) } : { baseFile: owner, sourceMap })
    }
    const input = child ? '@import "mapped-child" layer(owner);' : source
    let css: string, dependencies: readonly string[]
    if (operation === 'transform') {
      const result = await transformStylesheet(id, input, { baseManifest, projectDir: root, delivery })
      css = [result.code, ...result.stylesheets?.map(asset => asset.css) ?? []].join('\n')
      dependencies = result.dependencies
    } else {
      const scanner = { cwd: root, options: {}, css: { text: '', manifest: baseManifest }, latentClasses: new Set(), validClasses: new Set(), nativeClassNames: new Set(), usedNativeClasses: new Set(), registerNativeClasses: vi.fn() } as any
      // Keep the mapped text exactly intact: no new marker shifts map offsets.
      await collection.register(scanner, id, input, { baseManifest, projectDir: root, delivery })
      const result = await collection.compose({ scanner, baseManifest, projectDir: root, delivery })
      css = [result.css, ...result.stylesheets?.map(asset => asset.css) ?? []].join('\n')
      dependencies = collection.snapshot().dependencies
    }
    expect(css).toContain('padding:2rem')
    expect(css).toContain('margin:3rem')
    expect(css).not.toMatch(/99rem|never-|@reference/)
    expect(dependencies).toEqual(expect.arrayContaining(tokens))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test.each([
  { name: 'unmapped', map: { version: 3, names: [], sources: [], mappings: '' }, error: 'Original source unavailable' },
  { name: 'internal', map: { version: 3, names: [], sources: ['\0generated'], mappings: 'AAAA' }, error: 'Original source unavailable' },
  { name: 'remote', map: { version: 3, names: [], sources: ['https://example.invalid/a.scss'], mappings: 'AAAA' }, error: 'filesystem file' }
])('BH-0004 $name reference origins cannot fall back to an unrelated filesystem owner', ({ map, error }) => {
  const source = '@reference "./tokens.css";'
  expect(() => resolveReferenceOrigins(source, compileCSS(source).references!, '/owner.scss', JSON.stringify(map))).toThrow(error)
})

test('BH-0004 mapped virtual references require a filesystem base and retain compiler offsets', () => {
  const source = '@reference "./tokens.css";', map = JSON.stringify({ version: 3, names: [], sources: ['a.scss'], mappings: 'AAAA' })
  expect(() => resolveReferenceOrigins(source, compileCSS(source).references!, '\0virtual.css', map)).toThrow('absolute filesystem baseFile')
  expect(() => resolveReferenceOrigins(source, [{ source: './tokens.css' }], '/owner.scss', map)).toThrow('compiler-provided source offset')
})
