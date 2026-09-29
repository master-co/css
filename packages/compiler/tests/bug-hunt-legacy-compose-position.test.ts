import { expect, test } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCompiler } from '../src/index'
import { compileManifestSync, compileManifestFileSync } from '../src/node'

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
  "languageVersion": 8 as const
}
const definitions = '@mixin --paint {color:red}'
const cases = [
  { name: 'compose before native', body: ".example{@apply --all {color:red;}}.example{color:blue}", order: ['red', 'blue'] },
  { name: 'compose after native', body: ".example{color:blue}.example{@apply --all {color:red;}}", order: ['blue', 'red'] },
  { name: 'one anonymous layer', body: "@layer{.example{@apply --all {color:red;}}.example{color:blue!important}}", order: ['red', 'blue'] }
]
function check(css: string, entry: typeof cases[number]) {
  expect(css).not.toContain('@compose')
  expect(css).not.toContain('@--master-css-style-slot-')
  expect([...css.matchAll(/color:\s*(red|blue|#00f)/g)].map(match => match[1] === '#00f' ? 'blue' : match[1])).toEqual(entry.order)
  if (entry.name === 'one anonymous layer') expect(css.match(/@layer/g)).toHaveLength(1)
}
for (const binding of ['native', 'wasm'] as const) for (const entry of cases) {
  test(`legacy source ${binding} preserves ${entry.name}`, async () => {
    using compiler = await createCompiler({ binding })
    check(compiler.compileManifest(definitions + entry.body, { baseManifest, preserveNativeCSS: true }).css, entry)
  })
}
for (const entry of cases) {
  test(`Node sync source and legacy file preserve ${entry.name}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'master-legacy-compose-position-'))
    try {
      const source = definitions + entry.body, file = join(root, 'entry.css')
      writeFileSync(file, source)
      check(compileManifestSync(source, { baseManifest, preserveNativeCSS: true }).css, entry)
      check(compileManifestFileSync(file, { baseManifest, preserveNativeCSS: true }).css, entry)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}
