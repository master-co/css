import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileProjectManifest } from '../src/node-compiler'

const baseManifest = { version: 1 as const, utilities: [] }
for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) print']) {
  for (const compose of [false, true]) {
    test(`Node project retains imported definitions: ${qualifier || 'unqualified'}, compose=${compose}`, () => {
      const root = mkdtempSync(join(tmpdir(), 'project-graph-'))
      try {
        const entry = join(root, 'entry.css'), child = join(root, 'child.css')
        writeFileSync(entry, `@import "./child.css"${qualifier};.after{margin:1px}`)
        writeFileSync(child, '@utilities{paint{padding:2rem}}\n' + (compose ? '.composed{@compose paint;}' : '.composed{padding:2rem}') + '\n.card{padding:3rem}')
        const result = compileProjectManifest([entry], { root, baseManifest, preserveNativeCSS: true, classes: ['composed', 'card', 'after'] })
        expect(result.manifest.utilities?.some(utility => utility.name === 'paint')).toBe(true)
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
    writeFileSync(first, '@utilities{paint{padding:2rem}}')
    writeFileSync(second, '@import "./child.css" layer(cards);')
    writeFileSync(child, '@reference "./tokens.css";@safelist "paint";@source "./index.html";.card{@compose paint accent;}')
    writeFileSync(reference, '@utilities{accent{color:red}}')
    const result = compileProjectManifest([first, second], { root, baseManifest, preserveNativeCSS: true, classes: ['card'] })
    expect(result.manifest.utilities?.some(utility => utility.name === 'paint')).toBe(true)
    expect(result.css).toMatch(/padding:\s*2rem/)
    expect(result.css).toMatch(/color:\s*(?:red|#f00)/)
    expect(result.css).toContain('@layer cards')
    expect(result.extractionPolicy.safelist).toContain('paint')
    expect(result.extractionPolicy.include).toContain('./index.html')
    expect(result.dependencies).toEqual(expect.arrayContaining([first, second, child, reference]))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
