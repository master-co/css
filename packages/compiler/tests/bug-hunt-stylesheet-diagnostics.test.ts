import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import { MasterCSSError } from '@master/css-schema'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { createCompiler } from '../src/index'
import { createStylesheetCollection } from '../src/stylesheet/index-public'

const baseManifest = { version: 1 as const, languageVersion: 3 as const, utilities: [] }
const inputs = [
  { source: '/*😀*/.image{background:url(a.png)}\r\n.x{@compose unknown-utility;}', token: 'unknown-utility', code: 'invalid-compose-class' },
  { source: '/*😀*/.image{background:url(a.png)} @utilities invalid {paint{color:red}}', token: '@utilities', code: 'CSS_DIRECTIVE_ERROR' },
  { source: '.a{background:image-set("a.png" 1x,url(b.png) 2x)}\n/*😀*/.b{background:url(b.png)}.x{@compose unknown-utility;}', token: 'unknown-utility', code: 'invalid-compose-class' },
  { source: '/*\u{1F600}*/.a{background:image-set(\r\n"a.png" 1x,\r\nurl(b.png) 2x)}\n.x{@compose unknown-utility;}', token: 'unknown-utility', code: 'invalid-compose-class' }
]
function rangeFor(source: string, token: string) {
  const start = source.indexOf(token)
  const position = (offset: number) => {
    const lines = source.slice(0, offset).split(/\r\n?|\n/)
    return { line: lines.length - 1, character: lines.at(-1)!.length }
  }
  return { start: position(start), end: position(start + token.length) }
}
function failure(run: () => unknown): MasterCSSError {
  try { run() } catch (error) {
    expect(error).toBeInstanceOf(MasterCSSError)
    return error as MasterCSSError
  }
  throw new Error('Expected compiler diagnostic')
}
for (const binding of ['native', 'wasm'] as const) {
  for (const { source, token, code } of inputs) test(`BH-0004 ${binding} original graph diagnostic: ${source}`, async () => {
    using compiler = await createCompiler({ binding })
    const request = {
      graph: { entry: 'entry.css', files: { 'entry.css': "@import './child.css';", 'child.css': source }, edges: [{ from: 'entry.css', specifier: './child.css', resolved: 'child.css' }] },
      urls: { 'entry.css': '/out/entry.css', 'child.css': '/out/child.css' }, baseManifest
    }
    for (const resourceURLs of [undefined, { 'child.css': { 'a.png': '/output/a-much-longer-resource-name.png', 'b.png': '/b' } }]) {
      const error = failure(() => compiler.compileStylesheets({ ...request, resourceURLs }))
      expect(error.code).toBe(code)
      expect(error.diagnostics[0]).toMatchObject({ source: 'child.css', range: rangeFor(source, token) })
    }
  })
}

test('BH-0004 collection composition diagnostic uses original owner instead of variant ID', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-graph-diagnostic-'))
  using compiler = await createCompiler({ binding: 'native' })
  const manifest = compiler.compileManifest('@utilities{known{color:red}}', { baseManifest }).manifest
  const child = join(cwd, 'child.css')
  const entry = join(cwd, 'entry.css')
  const source = '.image{background:url(a.png)}\r\n/*😀*/.x{@compose known;}'
  writeFileSync(entry, "@import './child.css';@master entry;")
  writeFileSync(child, source)
  writeFileSync(join(cwd, 'a.png'), 'placeholder bytes; no browser requests in this diagnostic test')
  const scanner = new MasterCSSScanner({ manifest, verbose: 0 }, cwd)
  const collection = createStylesheetCollection()
  const delivery = { entryURL: '/output.css', stylesheetURL: (_file: string, variant?: string) => `/asset-${encodeURIComponent(variant ?? _file)}.css`, resourceURL: () => '/a-much-longer-resource-name.png' }
  try {
    await scanner.init()
    await collection.register(scanner, entry, "@import './child.css';@master entry;", { baseManifest: manifest, projectDir: cwd, delivery })
    await scanner.scan(join(cwd, 'index.html'), '<div class="x image"></div>')
    const error = await collection.compose({ scanner, baseManifest, projectDir: cwd, delivery }).then(() => { throw new Error('Expected invalid compose') }, error => error)
    expect(error).toBeInstanceOf(MasterCSSError)
    expect(error.code).toBe('invalid-compose-class')
    expect(error.diagnostics[0]).toMatchObject({ source: child, range: rangeFor(source, 'known') })
    expect(JSON.stringify(error.toJSON())).not.toContain('\\u0000')
  } finally { await scanner.dispose(); collection.dispose(); rmSync(cwd, { recursive: true, force: true }) }
})
