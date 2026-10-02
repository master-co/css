import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileProjectManifest } from '../src/node-compiler'

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
  "version": 6 as const,
  "languageVersion": 15 as const
, utilities: [{"name":"all","body":[{"type":"condition" as const,"condition":"@media all","body":[{"type":"contents" as const,"fallback":[]}]}],"kind":"static" as const}] }
for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) print']) {
  for (const compose of [false, true]) {
    test(`Node project retains imported definitions: ${qualifier || 'unqualified'}, compose=${compose}`, () => {
      const root = mkdtempSync(join(tmpdir(), 'project-graph-'))
      try {
        const entry = join(root, 'entry.css'), child = join(root, 'child.css')
        writeFileSync(entry, `@import "./child.css"${qualifier};.after{margin:1px}`)
        writeFileSync(child, '@mixin --paint {padding:2rem} @utility paint {padding:2rem}\n' + (compose ? ".composed{@apply --all {padding:2rem;}}" : '.composed{padding:2rem}') + '\n.card{padding:3rem}')
        if (qualifier) {
          expect(() => compileProjectManifest([entry], { root, baseManifest })).toThrow(/Qualified import.*global @mixin/)
          writeFileSync(entry, `@import "./child.css"${qualifier};@mixin --paint {padding:2rem} @utility paint {padding:2rem}.after{margin:1px}`)
          writeFileSync(child, (compose ? ".composed{padding:2rem;}" : '.composed{padding:2rem}') + '\n.card{padding:3rem}')
        }
        const result = compileProjectManifest([entry], { root, baseManifest, preserveNativeCSS: true, classes: ['composed', 'card', 'after'] })
        expect(result.manifest.mixins?.some(utility => utility.name === '--paint')).toBe(true)
        expect(result.css).toMatch(/padding:\s*2rem/)
        expect(result.css).toMatch(/padding:\s*3rem/)
        expect(result.css).not.toMatch(/@utilities|@compose/)
        if (qualifier.includes('layer')) expect(result.css).toContain('@layer')
        if (qualifier.includes('supports')) expect(result.css).toContain('@supports')
        if (qualifier.includes('print')) expect(result.css).toContain('@media print')
        expect(result.dependencies).toEqual(expect.arrayContaining([entry, child]))
      } finally { rmSync(root, { recursive: true, force: true }) }
    })
  }
}

test('Node project merges prior entries while resolving child-owned references and policies', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-graph-reference-'))
  try {
    const first = join(root, 'first.css'), second = join(root, 'second.css'), child = join(root, 'child.css'), reference = join(root, 'tokens.css')
    writeFileSync(first, '@mixin --paint {padding:2rem} @utility paint {padding:2rem}')
    writeFileSync(second, '@import "./child.css" layer(cards);')
    writeFileSync(child, "@reference \"./tokens.css\";@safelist \"paint\";@source \"./index.html\";.card{@apply --all {color:red;padding:2rem;}}")
    writeFileSync(reference, '@mixin --accent {color:red} @utility accent {color:red}')
    const result = compileProjectManifest([first, second], { root, baseManifest, preserveNativeCSS: true, classes: ['card'] })
    expect(result.manifest.mixins?.some(utility => utility.name === '--paint')).toBe(true)
    expect(result.css).toMatch(/padding:\s*2rem/)
    expect(result.css).toMatch(/color:\s*(?:red|#f00)/)
    expect(result.css).toContain('@layer cards')
    expect(result.extractionPolicy.safelist).toContain('paint')
    expect(result.extractionPolicy.include).toContain('./index.html')
    expect(result.dependencies).toEqual(expect.arrayContaining([first, second, child, reference]))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
