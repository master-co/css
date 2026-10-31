import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { compileRenderedStylesheet, createStylesheetCollection } from '@master/css-compiler/stylesheet'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const manifest: MasterCSSManifest = { version: 6, languageVersion: 18 }

async function fixture(source: string, files: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'master-composition-cache-'))
  for (const [name, content] of Object.entries({ 'style.css': source, ...files })) writeFileSync(join(root, name), content)
  const scanner = new MasterCSSScanner({ manifest }, root)
  await scanner.init()
  const stylesheets = createStylesheetCollection()
  const resourceURL = vi.fn((file: string) => 'https://assets.test/' + createHash('sha256').update(readFileSync(file)).digest('hex') + '.svg')
  const dependency = vi.fn()
  const options = {
    scanner, baseManifest: manifest, projectDir: root, includeGeneratedCSS: false,
    onDependency: dependency,
    delivery: { entryURL: 'https://assets.test/entry.css', stylesheetURL: (file: string) => 'https://assets.test/' + encodeURIComponent(file) + '.css', resourceURL }
  }
  await stylesheets.register(scanner, join(root, 'style.css'), source, options)
  return { root, scanner, stylesheets, resourceURL, dependency, options, async close() { stylesheets.dispose(); await scanner.dispose(); rmSync(root, { recursive: true, force: true }) } }
}

test('reuses class-independent output while observing dependencies and isolating results', async () => {
  const f = await fixture('@theme {--paint:red}.card{color:var(--paint);background:url("./pixel.svg")}', { 'pixel.svg': '<svg/>' })
  try {
    const first = await f.stylesheets.compose(f.options)
    const calls = f.resourceURL.mock.calls.length
    f.dependency.mockClear()
    await f.scanner.scanModule(join(f.root, 'page.tsx'), '<div className="(display:flex)"></div>')
    // Cached results are frozen, so one caller cannot change another's.
    expect(Object.isFrozen(first.emittedGlobals.variables)).toBe(true)
    const second = await f.stylesheets.compose(f.options)
    expect(second.css).toBe(first.css)
    expect(second.emittedGlobals).toEqual(first.emittedGlobals)
    expect(f.resourceURL).toHaveBeenCalledTimes(calls)
    expect(f.dependency).toHaveBeenCalledWith(join(f.root, 'pixel.svg'))
    const controller = new AbortController()
    controller.abort(Error('cancelled'))
    await expect(f.stylesheets.compose({ ...f.options, signal: controller.signal })).rejects.toThrow('cancelled')
  } finally { await f.close() }
})

test('invalidates for resource bytes, options, registration and deletion', async () => {
  const f = await fixture('.card{background:url("./pixel.svg")}', { 'pixel.svg': '<svg/>' })
  try {
    const first = await f.stylesheets.compose(f.options)
    writeFileSync(join(f.root, 'pixel.svg'), '<svg id="changed"/>')
    const changed = await f.stylesheets.compose(f.options)
    expect(changed.stylesheets).not.toEqual(first.stylesheets)
    const other = await f.stylesheets.compose({ ...f.options, delivery: { ...f.options.delivery, resourceURL: () => 'https://other.test/pixel.svg' } })
    expect(JSON.stringify(other)).toContain('https://other.test/pixel.svg')
    await f.stylesheets.register(f.scanner, join(f.root, 'style.css'), '.new{color:red}', f.options)
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).toContain('.new')
    f.stylesheets.delete(join(f.root, 'style.css'))
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).not.toContain('.new')
  } finally { await f.close() }
})

test('does not reuse class-dependent output when an imported stylesheet prunes native classes', async () => {
  const f = await fixture('@import "./child.css";', { 'child.css': '@prune native;.card{color:red}' })
  try {
    expect((await f.stylesheets.compose(f.options)).stylesheets!.map(sheet => sheet.css).join('')).not.toMatch(/\.card\s*\{/)
    await f.scanner.scanModule(join(f.root, 'page.tsx'), '<div className="card"></div>')
    expect((await f.stylesheets.compose(f.options)).stylesheets!.map(sheet => sheet.css).join('')).toMatch(/\.card\s*\{/)
  } finally { await f.close() }
})

test('observes reference changes and retries failures instead of caching them', async () => {
  const f = await fixture('@reference "./tokens.css";.card{color:var(--paint)}', { 'tokens.css': '@theme{--paint:red}' })
  try {
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).toContain('--paint:red')
    writeFileSync(join(f.root, 'tokens.css'), '@theme{--paint:blue}')
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).toContain('--paint:blue')
    rmSync(join(f.root, 'tokens.css'))
    await expect(f.stylesheets.compose(f.options)).rejects.toThrow()
    writeFileSync(join(f.root, 'tokens.css'), '@theme{--paint:green}')
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).toContain('--paint:green')
  } finally { await f.close() }
})

test('includes manifest versions and selected sources in the cache identity', async () => {
  const f = await fixture('.card{color:var(--paint)}')
  try {
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).not.toContain('--paint:blue')
    const { manifest: changed } = await compileRenderedStylesheet(join(f.root, 'tokens.css'), '@theme{--paint:blue}', { baseManifest: manifest })
    expect(JSON.stringify(await f.stylesheets.compose({ ...f.options, baseManifest: changed }))).toContain('--paint:blue')
    expect(JSON.stringify(await f.stylesheets.compose({ ...f.options, sourceIds: [] }))).not.toContain('.card')
    expect(JSON.stringify(await f.stylesheets.compose(f.options))).toContain('.card')
  } finally { await f.close() }
})

test('hashes theme namespaces that happen to share a dependency callback name', async () => {
  const f = await fixture('.card{color:var(--onDependency-one);background:url("./pixel.svg")}', { 'pixel.svg': '<svg/>' })
  const context = (value: string): MasterCSSManifest => ({ ...manifest, variables: { onDependency: [{ key: 'one', values: [{ path: [], value }] }] } })
  try {
    expect((await f.stylesheets.compose({ ...f.options, baseManifest: context('red') })).emittedGlobals.variables['onDependency-one']).toBe(1)
    const calls = f.resourceURL.mock.calls.length
    await f.stylesheets.compose({ ...f.options, baseManifest: context('blue') })
    expect(f.resourceURL.mock.calls.length).toBeGreaterThan(calls)
  } finally { await f.close() }
})

test('generated utilities and local source scans bypass class-independent reuse', async () => {
  const f = await fixture('@source "./page.tsx";@utility card{color:red}', { 'page.tsx': '<div className="card"></div>' })
  try {
    const options = { ...f.options, includeGeneratedCSS: true }
    expect((await f.stylesheets.compose(options)).css).toContain('.card')
    writeFileSync(join(f.root, 'page.tsx'), '<div></div>')
    expect((await f.stylesheets.compose(options)).css).not.toContain('.card')
  } finally { await f.close() }
})

test('does not retain a composition above four MiB', async () => {
  const f = await fixture(`.card{--large:"${'x'.repeat(2 * 1024 * 1024)}";background:url("./pixel.svg")}`, { 'pixel.svg': '<svg/>' })
  try {
    const first = await f.stylesheets.compose(f.options)
    const calls = f.resourceURL.mock.calls.length
    expect(JSON.stringify(first).length * 2).toBeGreaterThan(4 * 1024 * 1024)
    await f.stylesheets.compose(f.options)
    expect(f.resourceURL.mock.calls.length).toBeGreaterThan(calls)
  } finally { await f.close() }
})

test('does not retain output when an asset changes during composition', async () => {
  const f = await fixture('.card{background:url("./pixel.svg")}', { 'pixel.svg': '<svg/>' })
  try {
    const resolve = f.resourceURL.getMockImplementation()!
    f.resourceURL.mockImplementationOnce(file => {
      const url = resolve(file)
      writeFileSync(file, '<svg id="changed-during-compose"/>')
      return url
    })
    const first = await f.stylesheets.compose(f.options)
    expect((await f.stylesheets.compose(f.options)).stylesheets).not.toEqual(first.stylesheets)
  } finally { await f.close() }
})

test('reports invalid CSS on every call without retaining the failed output', async () => {
  const f = await fixture('.card{color:12px;background:url("./pixel.svg")}', { 'pixel.svg': '<svg/>' })
  try {
    expect((await f.stylesheets.compose(f.options)).diagnostics.some(value => value.severity === 'error')).toBe(true)
    const calls = f.resourceURL.mock.calls.length
    expect((await f.stylesheets.compose(f.options)).diagnostics.some(value => value.severity === 'error')).toBe(true)
    expect(f.resourceURL.mock.calls.length).toBeGreaterThan(calls)
    await expect(f.stylesheets.compose({ ...f.options, validation: 'error' })).rejects.toThrow('Strict CSS validation failed')
  } finally { await f.close() }
})
