import { expect, test } from 'vitest'
import { MasterCSSError } from '@master/css-schema'
import { createCompiler } from '../src/index'
import { transformStylesheet } from '../src/stylesheet/index-public'

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding} directives and references retain original diagnostic ranges`, async () => {
    using compiler = await createCompiler({ binding })
    for (const prefix of ["@import \"@master/css\";\n", "@reference \"./😀.css\";\r\n@import \"@master/css\";@preserve native;\n", "@source \"./😀.html\";\n/*😀*/@import \"@master/css\";\n"]) {
      for (const [body, token] of [['.example {\n  @compose unknown-utility;\n}', '@compose'], ["@utilities {paint {color:red}}", '@utilities'], ['@mixin --paint {@compose unknown-utility;}', '@compose']]) {
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
            baseManifest: {
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
  "languageVersion": 8 as const
}, resolutionManifest: {
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
  "languageVersion": 8 as const
}
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
  await expect(transformStylesheet('local.css', source, { baseManifest: {
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
  "languageVersion": 8 as const
} })).rejects.toMatchObject({
    diagnostics: [{ code: 'removed-compose-directive', source: 'local.css', range: { start: { line: 2, character: 2 }, end: { line: 2, character: 10 } } }]
  })
})
