import { expect, test } from 'vitest'
import { MasterCSSError } from '@master/css-schema'
import { createCompiler } from '../src/index'
import { transformStylesheet } from '../src/stylesheet/index-public'

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding} directives and references retain original diagnostic ranges`, async () => {
    using compiler = await createCompiler({ binding })
    for (const prefix of ['@master entry;\n', '@reference "./😀.css";\r\n@master entry;@preserve native;\n', '@source "./😀.html";\n/*😀*/@master entry;\n']) {
      for (const [body, token] of [['.example {\n  @compose unknown-utility;\n}', 'unknown-utility'], ['@utilities invalid {paint{color:red}}', '@utilities'], ['@utilities {paint{@compose unknown-utility;}}', 'unknown-utility']]) {
        const source = prefix + body
        const start = source.indexOf(token!)
        const position = (offset: number) => {
          const lines = source.slice(0, offset).split(/\r\n?|\n/)
          return { line: lines.length - 1, character: lines.at(-1)!.length }
        }
        let caught
        try {
          compiler.compileStylesheets({
            graph: { entry: 'entry.css', files: { 'entry.css': source }, edges: [] }, urls: { 'entry.css': '/entry.css' },
            baseManifest: { version: 1, utilities: [] }, resolutionManifest: { version: 1, utilities: [] }
          })
        } catch (error) { caught = error }
        expect(caught).toBeInstanceOf(MasterCSSError)
        expect((caught as MasterCSSError).diagnostics[0]).toMatchObject({ source: 'entry.css', range: { start: position(start), end: position(start + token!.length) } })
      }
    }
  })
}

test('BH-0004 local stylesheet lowering retains source text for diagnostics', async () => {
  const source = '/*😀*/\n.example {\n  @compose unknown-utility;\n}'
  await expect(transformStylesheet('local.css', source, { baseManifest: { version: 1, utilities: [] } })).rejects.toMatchObject({
    diagnostics: [{ code: 'invalid-compose-class', source: 'local.css', range: { start: { line: 2, character: 11 }, end: { line: 2, character: 26 } } }]
  })
})
