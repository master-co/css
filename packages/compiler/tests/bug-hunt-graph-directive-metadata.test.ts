import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { collectStylesheetDirectivesFromCSSGraph } from '../src/stylesheet/directives'
import { createExtractedCSS, registerStylesheetSource } from '../src/stylesheet'
import { MasterCSSScanner } from './helpers/scanner'

function project() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-graph-policies-')))
  const file = (name: string, source: string) => {
    const path = join(root, name)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, source)
    return path
  }
  return { root, file, dispose: () => rmSync(root, { recursive: true, force: true }) }
}

for (const external of [false, true]) for (const qualifier of ['', ' layer', ' layer(scope)', ' supports(display:grid)', ' screen', ' layer(scope) supports(display:grid) screen']) {
  test(`BH-0004 graph metadata preserves child policies: ${qualifier || 'plain'} external=${external}`, () => {
    const fixture = project()
    try {
      const entry = fixture.file('entry.css', `@import './styles/child.css'${qualifier};@source './root/*.html';`)
      const child = fixture.file('styles/child.css', `${external ? "@import 'https://invalid.invalid/remote.css';" : ''}@source './views/*.html';@source not './views/skip.*';@safelist 'block hidden';@blocklist 'legacy-*';@preserve native;`)
      const { directives, dependencies } = collectStylesheetDirectivesFromCSSGraph(entry, undefined, fixture.root)
      expect([...directives.include].sort()).toEqual(['root/*.html', 'styles/views/*.html'])
      expect(directives.exclude).toEqual(['styles/views/skip.*'])
      expect(directives.safelist).toEqual(['block', 'hidden'])
      expect(directives.blocklist[0]).toBeInstanceOf(RegExp)
      expect((directives.blocklist[0] as RegExp).test('legacy-card')).toBe(true)
      expect(directives.preserveNative).toBe(true)
      expect(dependencies).toEqual([entry, child])
    } finally { fixture.dispose() }
  })
}

test('BH-0004 metadata discovery does not compile native or managed CSS or load references', () => {
  const fixture = project()
  try {
    const entry = fixture.file('entry.css', "@import './child.css' screen;@reference './missing.css';@source './entry/*.html';")
    fixture.file('child.css', "@utilities{broken{@compose unregistered;}}.native{unknown:???}@media screen{@source './ignored/*.html';}@source './child/*.html';")
    const result = collectStylesheetDirectivesFromCSSGraph(entry, undefined, fixture.root)
    expect([...result.directives.include].sort()).toEqual(['child/*.html', 'entry/*.html'])
    expect(result.dependencies).toHaveLength(2)
  } finally { fixture.dispose() }
})

test('BH-0004 metadata discovery retains import cycles as errors', () => {
  const fixture = project()
  try {
    const entry = fixture.file('entry.css', "@import './child.css';")
    fixture.file('child.css', "@import './entry.css';")
    expect(() => collectStylesheetDirectivesFromCSSGraph(entry, undefined, fixture.root)).toThrow('Circular CSS import')
  } finally { fixture.dispose() }
})

test('BH-0004 registration scans the imported stylesheet source directory', async () => {
  const fixture = project()
  const scanner = new MasterCSSScanner({}, fixture.root)
  try {
    await scanner.init()
    fixture.file('app/styles/child.css', "@source './views/*.html';")
    fixture.file('app/styles/views/real.html', '<div class="block"></div>')
    fixture.file('app/views/wrong.html', '<div class="hidden"></div>')
    const entry = join(fixture.root, 'app/entry.css')
    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, entry, "@import './styles/child.css';@master entry;", { baseManifest: scanner.css.manifest })
    expect(stylesheetSources.get(entry).directives.include).toEqual(['app/styles/views/*.html'])
    const css = await createExtractedCSS({ scanner, stylesheetSources, baseManifest: scanner.css.manifest, projectDir: fixture.root })
    expect(css).toContain('.block{display:block}')
    expect(css).not.toContain('.hidden{display:none}')
  } finally { await scanner.dispose(); fixture.dispose() }
})

test('BH-0004 registration retains package-owned extraction policy', async () => {
  const fixture = project()
  const scanner = new MasterCSSScanner({}, fixture.root)
  try {
    await scanner.init()
    fixture.file('node_modules/@master/css/package.json', JSON.stringify({ name: '@master/css', style: './index.css', exports: { '.': './index.css' } }))
    const packageFile = fixture.file('node_modules/@master/css/index.css', "@source '../../../views/*.html';@safelist 'block';")
    fixture.file('views/page.html', '<div class="hidden"></div>')
    const entry = join(fixture.root, 'app/entry.css')
    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, entry, '@import "@master/css";', { projectDir: fixture.root, baseManifest: scanner.css.manifest })
    expect(stylesheetSources.get(entry).directives.include).toEqual(['views/*.html'])
    expect(stylesheetSources.get(entry).directives.safelist).toEqual(['block'])
    expect(stylesheetSources.get(entry).dependencies).toContain(packageFile)
  } finally { await scanner.dispose(); fixture.dispose() }
})
