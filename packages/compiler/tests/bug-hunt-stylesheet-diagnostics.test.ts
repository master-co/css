import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import { MasterCSSError } from '@master/css-schema'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { createCompiler } from '../src/index'
import { createStylesheetCollection } from '../src/stylesheet/index-public'

const baseManifest = {
  mixins: [
  {
    "name": "--all",
    "body": [
      {
        "type": "condition" as const,
        "condition": "@media all",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  }
],
  "version": 4 as const,
  "languageVersion": 10 as const
}
const inputs = [
  { source: '/*😀*/.image{background:url(a.png)}\r\n.x{@compose unknown-utility;}', token: '@compose' as const, code: 'removed-compose-directive' },
  { source: "/*😀*/.image{background:url(a.png)} @utilities {paint {color:red}}", token: '@utilities' as const, code: 'CSS_DIRECTIVE_ERROR' },
  { source: '.a{background:image-set("a.png" 1x,url(b.png) 2x)}\n/*😀*/.b{background:url(b.png)}.x{@compose unknown-utility;}', token: '@compose' as const, code: 'removed-compose-directive' },
  { source: '/*\u{1F600}*/.a{background:image-set(\r\n"a.png" 1x,\r\nurl(b.png) 2x)}\n.x{@compose unknown-utility;}', token: '@compose' as const, code: 'removed-compose-directive' }
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

test('collection reports removed directives using the original owner', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-graph-diagnostic-'))
  const child = join(cwd, 'child.css'), entry = join(cwd, 'entry.css')
  const source = '/*😀*/.x{@compose known;}'
  writeFileSync(entry, '@import "./child.css";@import \"@master/css\";')
  writeFileSync(child, source)
  const scanner = new MasterCSSScanner({ manifest: baseManifest, verbose: 0 }, cwd)
  const collection = createStylesheetCollection()
  try {
    await scanner.init()
    await expect(collection.register(scanner, entry, '@import "./child.css";@import \"@master/css\";', { baseManifest, projectDir: cwd }))
      .rejects.toMatchObject({ code: 'removed-compose-directive', diagnostics: [expect.objectContaining({ source: child, range: rangeFor(source, '@compose') })] })
  } finally { await scanner.dispose(); collection.dispose(); rmSync(cwd, { recursive: true, force: true }) }
})
