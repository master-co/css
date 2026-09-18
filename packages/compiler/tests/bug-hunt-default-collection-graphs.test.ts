import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createStylesheetCollection } from '../src/stylesheet/index-public'
import { MasterCSSScanner } from './helpers/scanner'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-default-collection-'))
  const file = (name: string, source: string) => {
    const path = join(root, name)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, source)
    return path
  }
  return { root, file, dispose: () => rmSync(root, { recursive: true, force: true }) }
}

for (const preserveNativeCSS of [false, true]) for (const includeNativeCSS of [false, true]) for (const includeMasterBaseCSS of [false, true]) for (const includeGeneratedCSS of [false, true]) {
  test(`BH-0004 default graph output preserve=${preserveNativeCSS}/native=${includeNativeCSS}/base=${includeMasterBaseCSS}/generated=${includeGeneratedCSS}`, async () => {
    const f = fixture(), scanner = new MasterCSSScanner({}, f.root)
    using collection = createStylesheetCollection()
    try {
      f.file('node_modules/@master/css/package.json', JSON.stringify({ name: '@master/css', style: './index.css' }))
      f.file('node_modules/@master/css/index.css', '@import "./base.css" layer(master);.from-master{border-top-width:7px}@utilities{package-custom{color:orange}}')
      f.file('node_modules/@master/css/base.css', '.from-master-child{border-bottom-width:8px}')
      f.file('child.css', '@safelist "nested";.nested{background-color:green}.unused{color:yellow}')
      const entry = f.file('entry.css', '@import "@master/css";@import "./child.css" supports(display:grid) screen;@master entry;@utilities{custom{color:purple}}.project{color:red}.composed{@compose block;}')
      await scanner.init()
      await collection.register(scanner, entry, readFileSync(entry, 'utf8'), { baseManifest: scanner.css.manifest, projectDir: f.root })
      expect(collection.snapshot().sources[0].isMasterCSS).toBe(true)
      await scanner.scan(join(f.root, 'index.html'), '<div class="project composed from-master from-master-child block custom package-custom"></div>')
      const result = await collection.compose({ scanner, baseManifest: scanner.css.manifest, projectDir: f.root, preserveNativeCSS, includeNativeCSS, includeMasterBaseCSS, includeGeneratedCSS })
      const css = result.css
      expect(css.includes('.project')).toBe(includeNativeCSS && preserveNativeCSS)
      expect(css.includes('.nested')).toBe(includeNativeCSS && preserveNativeCSS)
      expect(css).not.toContain('.unused')
      expect(css.includes('.composed')).toBe(includeNativeCSS)
      expect(css.includes('.from-master {')).toBe(includeMasterBaseCSS && preserveNativeCSS)
      expect(css.includes('.from-master-child')).toBe(includeMasterBaseCSS && preserveNativeCSS)
      expect(css.includes('.block{display:block}')).toBe(includeGeneratedCSS)
      expect(css.includes('.custom{color:purple}')).toBe(includeGeneratedCSS)
      expect(css.includes('.package-custom{color:orange}')).toBe(includeGeneratedCSS)
      expect(css).not.toMatch(/@(?:import|source|safelist|master)\b/)
      expect(result.stylesheets).toEqual([])
    } finally { await scanner.dispose(); f.dispose() }
  })
}

test('BH-0004 default graph composes separate entries with child-owned references and definitions', async () => {
  const f = fixture(), scanner = new MasterCSSScanner({}, f.root)
  using collection = createStylesheetCollection()
  try {
    f.file('parts/tokens.css', '@utilities{reference-paint{padding:2rem}}.reference-never{color:pink}')
    f.file('tokens.css', '@utilities{reference-paint{padding:99rem}}')
    f.file('parts/child.css', '@reference "./tokens.css";@source "./views/*.html";@utilities{custom{margin:3rem}}.native{@compose reference-paint;}')
    f.file('parts/views/view.html', '<div class="native custom"></div>')
    const first = f.file('first.css', '@import "./parts/child.css" layer(a) screen;@master entry;')
    const second = f.file('second.css', '@master entry;@safelist "second-custom";@utilities{second-custom{border-width:4px}}')
    await scanner.init()
    for (const entry of [first, second]) await collection.register(scanner, entry, readFileSync(entry, 'utf8'), { baseManifest: scanner.css.manifest, projectDir: f.root })
    const result = await collection.compose({ scanner, baseManifest: scanner.css.manifest, projectDir: f.root })
    expect(result.css).toContain('padding:2rem')
    expect(result.css).toContain('.custom{margin:3rem}')
    expect(result.css).toContain('.second-custom{border-width:4px}')
    expect(result.css).toContain('@layer a')
    expect(result.css).toContain('@media screen')
    expect(result.css).not.toMatch(/99rem|reference-never|@(?:source|safelist|reference|master)\b/)
    expect(result.dependencies).toContain(join(f.root, 'parts/tokens.css'))
  } finally { await scanner.dispose(); f.dispose() }
})

for (const marker of ['', '@master entry;@preserve native;']) test(`BH-0004 default graph preserves unpruned native rules ${marker || 'plain stylesheet'}`, async () => {
  const f = fixture(), scanner = new MasterCSSScanner({}, f.root)
  using collection = createStylesheetCollection()
  try {
    await scanner.init()
    await collection.register(scanner, join(f.root, 'entry.css'), `${marker}.unscanned{display:grid}`, { baseManifest: scanner.css.manifest, projectDir: f.root })
    const result = await collection.compose({ scanner, baseManifest: scanner.css.manifest, projectDir: f.root })
    expect(result.css).toContain('.unscanned')
    expect(result.css).not.toMatch(/@(?:master|preserve)\b/)
  } finally { await scanner.dispose(); f.dispose() }
})
